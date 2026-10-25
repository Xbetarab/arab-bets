import { SPORTS } from "@/lib/supabase/types";

// These limits apply to public user actions, not administrator or ghost tools.
const MAX_URL_LENGTH = 2048;
const PREDICTION_TYPES = new Set([
  "نتيجة المباراة",
  "عدد الأهداف",
  "كلا الفريقين يسجل",
  "أول من يسجل",
  "هاندي كاب",
  "أخرى",
]);

export function requireRecord(value: unknown, label: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} غير صالح`);
  }
  return value as Record<string, unknown>;
}

export function requireText(
  value: unknown,
  maxLength: number,
  label: string,
  allowEmpty = false
): string {
  if (
    typeof value !== "string" ||
    value.length > maxLength ||
    value.includes("\0")
  ) {
    throw new Error(`${label} غير صالح أو يتجاوز الحد المسموح`);
  }
  const text = value.trim();
  if (!allowEmpty && !text) throw new Error(`${label} مطلوب`);
  return text;
}

export function requireUuid(value: unknown, label = "المعرّف"): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  ) {
    throw new Error(`${label} غير صالح`);
  }
  return value.toLowerCase();
}

export function requireWebUrl(value: unknown, label: string): string {
  const text = requireText(value, MAX_URL_LENGTH, label);
  if (!/^https?:\/\//i.test(text) || /[\s\u0000-\u001f\u007f\\]/.test(text)) {
    throw new Error(`${label} غير صالح`);
  }
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new Error(`${label} غير صالح`);
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    !url.hostname ||
    url.username ||
    url.password
  ) {
    throw new Error(`${label} غير صالح`);
  }
  return text;
}

export function optionalWebUrl(value: unknown, label: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  return requireWebUrl(value, label);
}

function requirePagePath(value: unknown, label: string): string {
  const path = requireText(value, MAX_URL_LENGTH, label);
  if (!path.startsWith("/") || path.startsWith("//") || /[\s\\\u0000-\u001f\u007f]/.test(path)) {
    throw new Error(`${label} غير صالح`);
  }
  return path;
}

function optionalText(value: unknown, maxLength: number, label: string) {
  if (value === undefined || value === null || value === "") return null;
  const text = requireText(value, maxLength, label, true);
  if (/[\u0000-\u001f\u007f]/.test(text)) throw new Error(`${label} غير صالح`);
  return text || null;
}

function requireMatchDate(value: unknown) {
  const date = requireText(value, 40, "تاريخ المباراة");
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/.exec(date);
  if (!parts) throw new Error("تاريخ المباراة غير صالح");
  const [, year, month, day, hour, minute, second = "0"] = parts;
  const daysInMonth = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  if (
    Number(month) < 1 || Number(month) > 12 ||
    Number(day) < 1 || Number(day) > daysInMonth ||
    Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59 ||
    !Number.isFinite(Date.parse(date))
  ) {
    throw new Error("تاريخ المباراة غير صالح");
  }
  // Keep datetime-local inputs in their original form, as the existing UI expects.
  return date;
}

function validateTipInput(value: unknown) {
  const tip = requireRecord(value, "بيانات التوقع");
  const predictionType = requireText(tip.prediction_type, 50, "نوع التوقع");
  if (!PREDICTION_TYPES.has(predictionType)) throw new Error("نوع التوقع غير صالح");
  if (typeof tip.odds !== "number" || !Number.isFinite(tip.odds) || tip.odds < 1) {
    throw new Error("الأوديز غير صالحة");
  }
  if (typeof tip.confidence !== "number" || !Number.isInteger(tip.confidence) || tip.confidence < 1 || tip.confidence > 5) {
    throw new Error("مستوى الثقة غير صالح");
  }
  // Project only supported fields: callers cannot persist arbitrary JSON keys.
  return {
    match_home: requireText(tip.match_home, 150, "الفريق المضيف"),
    match_away: requireText(tip.match_away, 150, "الفريق الضيف"),
    league: requireText(tip.league, 150, "الدوري"),
    match_date: requireMatchDate(tip.match_date),
    prediction: requireText(tip.prediction, 500, "التوقع"),
    prediction_type: predictionType,
    odds: tip.odds,
    confidence: tip.confidence,
    result: "pending" as const,
    settled_at: null,
  };
}

export function validatePostInput(content: unknown, sport: unknown, mediaUrls: unknown, tipData: unknown) {
  const text = requireText(content, 500, "محتوى المنشور", true);
  let validatedSport: string | null = null;
  if (sport !== null && sport !== undefined && sport !== "") {
    validatedSport = requireText(sport, 30, "الرياضة");
    if (!SPORTS.some((item) => item.value === validatedSport)) throw new Error("الرياضة غير صالحة");
  }
  let media: string[] | null = null;
  if (mediaUrls !== null && mediaUrls !== undefined) {
    // The public composer supports a single uploaded image.
    if (!Array.isArray(mediaUrls) || mediaUrls.length > 1) throw new Error("صور المنشور غير صالحة");
    media = mediaUrls.map((url) => requireWebUrl(url, "رابط الصورة"));
    if (!media.length) media = null;
  }
  const tip = tipData === null || tipData === undefined ? null : validateTipInput(tipData);
  if (!text && !media?.length && !tip) throw new Error("المنشور فارغ");
  return { content: text, sport: validatedSport, media_urls: media, tip_data: tip };
}

export function requireTipResult(value: unknown): "won" | "lost" | "void" {
  if (value !== "won" && value !== "lost" && value !== "void") throw new Error("نتيجة التوقع غير صالحة");
  return value;
}

export function readAutoApprove(value: unknown, key: "auto_approve_posts" | "auto_approve_comments") {
  return !!value && typeof value === "object" && !Array.isArray(value) && (value as Record<string, unknown>)[key] === true;
}

export function validateProfileInput(value: unknown) {
  const data = requireRecord(value, "بيانات الملف الشخصي");
  const displayName = requireText(data.display_name, 50, "الاسم");
  if (/[\u0000-\u001f\u007f]/.test(displayName)) throw new Error("الاسم غير صالح");
  return {
    display_name: displayName,
    avatar_url: optionalWebUrl(data.avatar_url, "رابط الصورة الشخصية"),
    cover_url: optionalWebUrl(data.cover_url, "رابط صورة الغلاف"),
  };
}

export function validateLinkClickInput(value: unknown) {
  const data = requireRecord(value, "بيانات الزيارة");
  const linkType = optionalText(data.link_type, 30, "نوع الرابط");
  if (linkType !== null && linkType !== "external" && linkType !== "internal") throw new Error("نوع الرابط غير صالح");
  return {
    target_url: requireWebUrl(data.target_url, "الرابط"),
    link_type: linkType,
    source_page: data.source_page == null || data.source_page === "" ? null : requirePagePath(data.source_page, "صفحة المصدر"),
    user_agent: optionalText(data.user_agent, 512, "بيانات المتصفح"),
    referrer: optionalWebUrl(data.referrer, "رابط الإحالة"),
  };
}

export function validatePageViewInput(value: unknown) {
  const data = requireRecord(value, "بيانات الزيارة");
  return {
    page_url: requirePagePath(data.page_url, "الصفحة"),
    referrer: optionalWebUrl(data.referrer, "رابط الإحالة"),
    user_agent: optionalText(data.user_agent, 512, "بيانات المتصفح"),
    utm_source: optionalText(data.utm_source, 256, "مصدر الحملة"),
    utm_medium: optionalText(data.utm_medium, 256, "وسيط الحملة"),
    utm_campaign: optionalText(data.utm_campaign, 256, "اسم الحملة"),
  };
}
