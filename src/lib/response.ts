import { NextResponse } from "next/server";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    { success: true, data, error: null, timestamp: new Date().toISOString() },
    { status }
  );
}

export function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { success: false, data: null, error: message, timestamp: new Date().toISOString() },
    { status }
  );
}
