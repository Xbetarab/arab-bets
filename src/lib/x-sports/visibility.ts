const SOURCE_MENTION = /(?:https?:\/\/)?(?:[\w-]+\.)?(?:x\.com|twitter\.com|t\.co)\b|twitter|\bX\b|(?:^|[_\s@])x[_-]?(?:sports?|football|news|bets?|tweets?|posts?|updates?)\b|تويتر|(?:^|[^\p{L}\p{N}])(?:إكس|اكس)(?=$|[^\p{L}\p{N}])/iu;

export function hasSourceMention(value: unknown): boolean {
  return typeof value === "string" && SOURCE_MENTION.test(value);
}

export function displayableImportedRow(row: {
  body: string;
  author_name: string;
  author_username: string;
  language: string | null;
}): boolean {
  const arabicLetters = (row.body?.match(/[\u0621-\u064A\u0671-\u06D3]/gu) ?? []).length;
  const letters = (row.body?.match(/\p{L}/gu) ?? []).length;
  return row.language === "ar" && arabicLetters >= 8 &&
    arabicLetters / Math.max(letters, 1) >= 0.4 &&
    !hasSourceMention(row.body) &&
    !hasSourceMention(row.author_name) &&
    !hasSourceMention(row.author_username);
}

export function hasEnoughDisplayableReplies(root: {
  x_id: string;
}, replies: Array<{
  x_id: string;
  conversation_id: string;
  in_reply_to_x_id: string | null;
  body: string;
  author_name: string;
  author_username: string;
  language: string | null;
}>, minimum = 3): boolean {
  return new Set(replies.filter((reply) =>
    reply.conversation_id === root.x_id &&
    reply.in_reply_to_x_id === root.x_id &&
    displayableImportedRow(reply)).map((reply) => reply.x_id)).size >= minimum;
}
