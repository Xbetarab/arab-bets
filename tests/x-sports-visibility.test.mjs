import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const visibilitySource = readFileSync(new URL("../src/lib/x-sports/visibility.ts", import.meta.url), "utf8");
const visibilityJavaScript = ts.transpileModule(visibilitySource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { displayableImportedRow, hasEnoughDisplayableReplies, hasSourceMention } = await import(
  `data:text/javascript;base64,${Buffer.from(visibilityJavaScript).toString("base64")}`
);

test("rejects source domains and branded handles before public rendering", () => {
  for (const value of ["https://x.com/user/status/1", "https://t.co/abc", "TwitterSports", "xSports", "X_football", "@X_sports", "تويتر"]) {
    assert.equal(hasSourceMention(value), true, value);
  }
  assert.equal(displayableImportedRow({ body: "الليلة مباراة كبيرة للجمهور", language: "ar", author_name: "Sports Desk", author_username: "TwitterSports" }), false);
  assert.equal(displayableImportedRow({ body: "تابع https://x.com/abc لمشاهدة المباراة", language: "ar", author_name: "Sports Desk", author_username: "sportsdesk" }), false);
  assert.equal(hasSourceMention("pic.twitter.com/abc"), true);
  assert.equal(hasSourceMention("mobile.x.com/abc"), true);
  assert.equal(hasSourceMention("Xavi scored and xG rose"), false);
});

test("preserves original text of an allowed imported row", () => {
  const row = { body: "فوز رائع في مباراة الفريق الليلة بنتيجة ٢-١!", language: "ar", author_name: "أحمد", author_username: "ahmad_sports" };
  assert.equal(displayableImportedRow(row), true);
  assert.equal(row.body, "فوز رائع في مباراة الفريق الليلة بنتيجة ٢-١!");
});

test("old English copies and roots without three valid direct Arabic replies are hidden", () => {
  const root = { x_id: "123", body: "أخبار رياضية جديدة من مباراة المنتخب اليوم", language: "ar", author_name: "محرر", author_username: "editor" };
  const reply = (id, changes = {}) => ({
    x_id: id, conversation_id: "123", in_reply_to_x_id: "123",
    body: "تعليق عربي واضح على المباراة وأداء الفريق اليوم",
    language: "ar", author_name: "مشجع", author_username: `fan${id}`, ...changes,
  });
  assert.equal(displayableImportedRow({ ...root, language: "en" }), false);
  assert.equal(displayableImportedRow({ ...root, body: "Barcelona beats PSG tonight", language: "ar" }), false);
  assert.equal(hasEnoughDisplayableReplies(root, []), false);
  assert.equal(hasEnoughDisplayableReplies(root, [reply("1"), reply("2")]), false);
  assert.equal(hasEnoughDisplayableReplies(root, [reply("1"), reply("2"), reply("3", { language: "en" })]), false);
  assert.equal(hasEnoughDisplayableReplies(root, [reply("1"), reply("2"), reply("3", { in_reply_to_x_id: "999" })]), false);
  assert.equal(hasEnoughDisplayableReplies(root, [reply("1"), reply("2"), reply("3")]), true);
});
