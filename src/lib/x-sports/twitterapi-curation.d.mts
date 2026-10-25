export interface ImportedSportsRow {
  x_id: string; conversation_id: string; in_reply_to_x_id: string | null;
  author_x_id: string; author_username: string; author_name: string; author_avatar_url: string | null;
  body: string; posted_at: string; language: string | null;
  media_json: Array<{type: string; url: string; alt_text: string | null}>; links_json: unknown[];
  matched_query: string; last_synced_at: string; expires_at: string; deleted_at: null; is_visible: boolean;
}
export const NEWS_SOURCES: string[];
export function normalizeArabicForModeration(value: unknown): string;
export function cleanReplyText(value: unknown): string;
export function hasProfanityOrInsult(value: unknown): boolean;
export function isPromotional(value: unknown): boolean;
export function isSportsNewsText(value: unknown, username?: string): boolean;
export function isCleanArabicSportsRow(row: unknown, options?: {requireNews?: boolean}): boolean;
export function extractDisplayContent(tweet: unknown): {text: string; media: ImportedSportsRow['media_json']};
export function classifyTwitterApiTweet(tweet: unknown, options?: {matchedQuery?: string; now?: Date; retentionHours?: number; rootId?: string | null; minSourceReplies?: number; since?: number}): {row: ImportedSportsRow | null; reason: string | null};
export function normalizeTwitterApiTweet(tweet: unknown, options?: Parameters<typeof classifyTwitterApiTweet>[1]): ImportedSportsRow | null;
export function scoreNewsCandidate(tweet: unknown): number;
export function buildNewsQueries(options: {since: number; until: number}): string[];
