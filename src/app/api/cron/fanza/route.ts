import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (process.env.FANZA_IMPORT_ENABLED !== 'true') {
    return NextResponse.json({
      status: 'disabled',
      message: 'FANZA automatic import is disabled',
    });
  }

  if (process.env.FANZA_PRODUCTION_IMPORT_APPROVED !== 'true') {
    return NextResponse.json({
      status: 'blocked',
      message: 'FANZA production import is not approved',
    });
  }

  return NextResponse.json({
    status: 'ready',
    message: 'FANZA API integration is not enabled yet',
  });
}
