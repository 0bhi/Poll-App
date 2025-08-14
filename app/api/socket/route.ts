import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return new Response('Socket.IO endpoint - use custom server for WebSocket connections', { 
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    }
  });
}

export async function POST(request: NextRequest) {
  return new Response('Socket.IO endpoint - use custom server for WebSocket connections', { 
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    }
  });
}
