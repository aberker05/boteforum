import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSiteSettings } from '@/lib/siteSettings';

export async function GET() {
  try {
    const [, settings] = await Promise.all([
      prisma.$queryRaw`SELECT 1`,
      getSiteSettings(),
    ]);
    const fullName = `${settings.siteNamePrimary}${settings.siteNameAccent}`;
    return NextResponse.json({
      status: 'ok',
      service: fullName,
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  } catch (error) {
    console.error('Healthcheck error:', error);
    return NextResponse.json(
      {
        status: 'error',
        service: 'ForumService',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

