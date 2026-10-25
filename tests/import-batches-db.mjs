import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Supply an audited, local PGlite module; no download or live DB connection.
const modulePath = process.env.BATCH_TEST_PGLITE_MODULE;
if (!modulePath) throw new Error('BATCH_TEST_PGLITE_MODULE must name the local PGlite module');
const { PGlite } = await import(modulePath);
const db = new PGlite();
const here = path.dirname(fileURLToPath(import.meta.url));
const [fixture, migration] = await Promise.all([
  readFile(path.join(here, 'import-batches-db.sql'), 'utf8'),
  readFile(path.join(here, '../database/import-batches.sql'), 'utf8'),
]);
const [setup, tests] = fixture.split('-- APPLY MIGRATION HERE --');
try {
  await db.exec(setup);
  await db.exec(migration);
  await db.exec(tests);
  const results = await db.query('select name, passed from fixture_results order by name');
  console.log(JSON.stringify({ runtime: 'PGlite PostgreSQL', passed: results.rows.length, tests: results.rows }, null, 2));
} finally {
  await db.close();
}
