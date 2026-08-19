import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export class RequestIdMiddleware {
  use = (req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.header('x-request-id') || randomUUID()).toString();
    res.setHeader('x-request-id', requestId);
    (req as Request & { requestId?: string }).requestId = requestId;
    next();
  };
}
