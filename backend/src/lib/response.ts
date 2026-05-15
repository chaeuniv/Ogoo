import { Response } from "express";

export function successResponse<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({
    success: true,
    data,
    error: null,
    timestamp: new Date().toISOString(),
  });
}

export function errorResponse(
  res: Response,
  status: number,
  code: string,
  message: string
) {
  return res.status(status).json({
    success: false,
    data: null,
    error: { code, message },
    timestamp: new Date().toISOString(),
  });
}
