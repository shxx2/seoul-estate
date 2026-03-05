import { NextResponse } from 'next/server';

export type ErrorCode =
  | 'INVALID_PARAMS'
  | 'NAVER_API_ERROR'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'DETAIL_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export function apiSuccess<T>(data: T) {
  return NextResponse.json({ success: true, data });
}

export function apiError(code: ErrorCode, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}
