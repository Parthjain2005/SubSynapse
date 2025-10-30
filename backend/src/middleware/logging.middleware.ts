import { Request, Response, NextFunction } from 'express';

const SENSITIVE_FIELDS = ['password', 'email', 'token', 'verificationToken', 'passwordResetToken'];

const maskData = (data: any): any => {
  if (!data) {
    return data;
  }

  const maskedData = { ...data };
  for (const field of SENSITIVE_FIELDS) {
    if (maskedData[field]) {
      maskedData[field] = '********';
    }
  }
  return maskedData;
};

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;

  res.json = function (body) {
    console.log(`Request Body: ${JSON.stringify(maskData(req.body))}`);
    console.log(`Response Body: ${JSON.stringify(maskData(body))}`);
    return originalJson.call(this, body);
  };

  next();
};
