import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  // Clamp future timestamps to "now" — prevents imported posts
  // with future created_at from showing "in X hours"
  if (date.getTime() > Date.now()) {
    return "الآن";
  }
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: ar,
  });
}
