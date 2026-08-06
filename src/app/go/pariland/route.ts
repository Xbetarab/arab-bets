import { NextResponse } from 'next/server';

/**
 * تحويل الأفلييت الداخلي — /go/pariland
 *
 * ⚠️ لتغيير رابط الأفلييت مستقبلاً: عدّل قيمة AFFILIATE_URL أدناه فقط.
 * هذا هو المكان الوحيد في الموقع كله الذي يحتوي الرابط الفعلي —
 * كل أزرار CTA في صفحات pariland تشير لـ/go/pariland لا للرابط مباشرة.
 * لا حاجة للمس أي صفحة أخرى عند التغيير.
 */

const AFFILIATE_URL = 'https://plrefra.com/L?tag=d_4170992m_99567c_&site=4170992&ad=99567';

export async function GET() {
  return NextResponse.redirect(AFFILIATE_URL, 302);
}
