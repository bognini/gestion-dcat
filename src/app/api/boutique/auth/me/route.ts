import { NextResponse } from 'next/server';
import { getBoutiqueClientFromCookie } from '@/lib/boutique-auth';

export async function GET() {
  try {
    const client = await getBoutiqueClientFromCookie();
    if (!client) {
      return NextResponse.json({ client: null }, { status: 401 });
    }
    return NextResponse.json({ client });
  } catch (error) {
    console.error('Error getting boutique client:', error);
    return NextResponse.json({ client: null }, { status: 500 });
  }
}
