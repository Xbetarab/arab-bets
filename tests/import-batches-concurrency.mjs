import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import assert from 'node:assert/strict';
const exec = promisify(execFile);
const container = process.env.BATCH_TEST_CONTAINER;
if (!container || !container.startsWith('arabtips-batches-test-')) throw new Error('Explicit isolated test container required');
const database = process.env.BATCH_TEST_DATABASE || 'postgres';
async function sql(query) {
  const { stdout } = await exec('podman', ['exec', container, 'psql', '-U', 'postgres', '-d', database, '-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-c', query], { maxBuffer: 2_000_000 });
  return stdout.trim().split('\n').filter(Boolean).at(-1);
}
const completed = [];
const create = async (hash, content, count = 1) => JSON.parse(await sql(`select fixture_create('${hash}',(select jsonb_agg(fixture_item('p'||i,'post','${content} '||i,'2026-07-01',5) order by i) from generate_series(0,${count - 1}) i))`));
const control = (id, action) => sql(`select admin_import_control('${id}','${action}')`);
const step = id => sql(`select admin_import_step('${id}',10)`);

const a = await create('4', 'concurrency same batch', 12);
await control(a.id, 'start');
await Promise.all([step(a.id), step(a.id)]);
assert.equal(await sql(`select count(*) from posts where content like 'concurrency same batch %'`), '12');
assert.equal(await sql(`select status from admin_import_batches where id='${a.id}'`), 'completed');
assert.equal(await sql(`select count(*) from admin_import_receipts where batch_id='${a.id}'`), '12');
completed.push('two workers on same batch publish each item exactly once');

const [b, c] = await Promise.all([create('5', 'concurrency cross batch'), create('6', 'concurrency cross batch')]);
await Promise.all([control(b.id, 'start'), control(c.id, 'start')]);
await Promise.all([step(b.id), step(c.id)]);
assert.equal(await sql(`select count(*) from posts where content='concurrency cross batch 0'`), '1');
assert.equal(await sql(`select string_agg(plan->0->>'state',',' order by plan->0->>'state') from admin_import_batches where id in ('${b.id}','${c.id}')`), 'duplicate,published');
completed.push('two batches with same content share one atomic publication receipt');

const [d, e] = await Promise.all([create('7', 'concurrency input winner one'), create('7', 'concurrency input winner two')]);
assert.equal(d.id, e.id);
assert.deepEqual(d.plan, e.plan);
completed.push('simultaneous identical source creation returns one stable preview');

await sql(`create function public.fixture_slow_publish() returns trigger language plpgsql as $$ begin if new.content='concurrency slow 0' then perform pg_sleep(0.6); end if; return new; end $$; create trigger fixture_slow_publish before insert on public.posts for each row execute function public.fixture_slow_publish();`);
const paused = await create('8', 'concurrency slow', 20);
await control(paused.id, 'start');
const inflight = sql(`set application_name='arabtips-batch-test-inflight'; select admin_import_step('${paused.id}',10)`);
let sleeping = false;
for (let i = 0; i < 30; i++) {
  if (await sql(`select exists(select 1 from pg_stat_activity where application_name='arabtips-batch-test-inflight' and wait_event='PgSleep')`) === 't') { sleeping = true; break; }
  await new Promise(resolve => setTimeout(resolve, 20));
}
assert.equal(sleeping, true, 'confirmed publish transaction is in progress');
const pauseAck = await control(paused.id, 'pause');
await inflight;
assert.equal(JSON.parse(pauseAck).status, 'paused');
await Promise.all([step(paused.id), step(paused.id)]);
assert.equal(await sql(`select count(*) from posts where content like 'concurrency slow %'`), '10');
assert.equal(await sql(`select count(*) from admin_import_batches b cross join lateral jsonb_array_elements(b.plan) i where b.id='${paused.id}' and i->>'state'='pending'`), '10');
completed.push('pause waits for in-flight commit and subsequent workers cannot publish');

let denied = false;
try { await sql(`set role anon; select admin_import_step('${a.id}',1)`); } catch { denied = true; }
assert.equal(denied, true);
completed.push('anonymous RPC execution is denied at the database');
console.log(JSON.stringify({ runtime: 'PostgreSQL 17, concurrent isolated sessions', passed: completed.length, tests: completed }, null, 2));
