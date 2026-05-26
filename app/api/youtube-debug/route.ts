import { NextResponse } from 'next/server';

export async function GET() {
  // Disable in production to secure internal details
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }

  return NextResponse.json({ message: 'Debug route active in development.' });
}
