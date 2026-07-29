import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: any;
}

export const adminAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecret');
    
    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied: Admin role required' });
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
