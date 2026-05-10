import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = 'career-compass-ai-jwt-secret-2025'

export interface AuthRequest extends Request {
  user?: {
    id: number
    email: string
    username: string
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ code: 401, message: '未提供认证令牌', data: null })
    return
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; username: string }
    req.user = { id: decoded.id, email: decoded.email, username: decoded.username }
    next()
  } catch (error) {
    res.status(401).json({ code: 401, message: '认证令牌无效或已过期', data: null })
  }
}

export { JWT_SECRET }
