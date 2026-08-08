import { NextResponse } from 'next/server';

/**
 * تحويل الأفلييت المصري الداخلي — /go/1xbet-eg
 *
 * ⚠️ لتغيير رابط الأفلييت المصري مستقبلاً: عدّل قيمة AFFILIATE_URL أدناه فقط.
 * هذا المكان الوحيد الذي يحتوي الرابط الفعلي — كل أزرار "حمّل التطبيق"
 * في صفحات /eg/1xbet تشير لـ/go/1xbet-eg لا للرابط مباشرة.
 */

const AFFILIATE_URL = 'https://reffpa.com/L?tag=d_3324943m_4129c_&site=3324943&ad=4129';

export async function GET() {
  return NextResponse.redirect(AFFILIATE_URL, 302);
}
