import { NextResponse } from 'next/server';

/**
 * تحويل الأفلييت الداخلي — /go/1xbet
 * يخفي رابط dub.sh الخارجي خلف مسار داخلي نظيف (ثقة أعلى للزائر ولمحرك البحث).
 * 302 (مؤقت) عمداً: يسمح بتغيير وجهة الأفلييت مستقبلاً دون أي تعديل بالصفحات.
 */

const AFFILIATE_URL = 'https://dub.sh/fP9V2WH';

export async function GET() {
  return NextResponse.redirect(AFFILIATE_URL, 302);
}
