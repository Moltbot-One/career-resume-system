import { Router, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../database/init.js'
import { authMiddleware, type AuthRequest, JWT_SECRET } from '../middleware/auth.js'

const router = Router()

function generateToken(user: { id: number; email: string; username: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: '2h' }
  )
}

function generateRefreshToken(user: { id: number; email: string; username: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

router.post('/register', (req: AuthRequest, res: Response): void => {
  try {
    const { email, username, password } = req.body

    if (!email || !username || !password) {
      res.status(400).json({ code: 400, message: '请填写所有必填字段', data: null })
      return
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      res.status(409).json({ code: 409, message: '该邮箱已被注册', data: null })
      return
    }

    const passwordHash = bcrypt.hashSync(password, 10)

    const result = db.prepare(
      'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)'
    ).run(email, username, passwordHash)

    const user = { id: result.lastInsertRowid as number, email, username }
    const token = generateToken(user)
    const refreshToken = generateRefreshToken(user)

    res.status(201).json({
      code: 201,
      message: '注册成功',
      data: {
        user: { id: user.id, email, username, avatar: '', membershipType: 'free' },
        tokens: { accessToken: token, refreshToken }
      }
    })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

router.post('/login', (req: AuthRequest, res: Response): void => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ code: 400, message: '请填写邮箱和密码', data: null })
      return
    }

    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any
    if (!row) {
      res.status(401).json({ code: 401, message: '邮箱或密码错误', data: null })
      return
    }

    const valid = bcrypt.compareSync(password, row.password_hash)
    if (!valid) {
      res.status(401).json({ code: 401, message: '邮箱或密码错误', data: null })
      return
    }

    const user = { id: row.id, email: row.email, username: row.username }
    const token = generateToken(user)
    const refreshToken = generateRefreshToken(user)

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        user: {
          id: row.id,
          email: row.email,
          username: row.username,
          avatar: row.avatar,
          membershipType: row.membership_type
        },
        tokens: { accessToken: token, refreshToken }
      }
    })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

router.post('/refresh', (req: AuthRequest, res: Response): void => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      res.status(400).json({ code: 400, message: '请提供刷新令牌', data: null })
      return
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any
    if (decoded.type !== 'refresh') {
      res.status(401).json({ code: 401, message: '无效的刷新令牌', data: null })
      return
    }

    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id) as any
    if (!row) {
      res.status(401).json({ code: 401, message: '用户不存在', data: null })
      return
    }

    const user = { id: row.id, email: row.email, username: row.username }
    const token = generateToken(user)
    const newRefreshToken = generateRefreshToken(user)

    res.json({
      code: 200,
      message: '令牌刷新成功',
      data: { tokens: { accessToken: token, refreshToken: newRefreshToken } }
    })
  } catch (error) {
    res.status(401).json({ code: 401, message: '刷新令牌无效或已过期', data: null })
  }
})

router.get('/me', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const row = db.prepare('SELECT id, email, username, avatar, membership_type, created_at FROM users WHERE id = ?').get(req.user!.id) as any

    if (!row) {
      res.status(404).json({ code: 404, message: '用户不存在', data: null })
      return
    }

    res.json({ code: 200, message: '获取成功', data: { id: row.id, email: row.email, username: row.username, avatar: row.avatar, membershipType: row.membership_type, createdAt: row.created_at } })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

export default router
