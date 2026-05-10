import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import assessmentRoutes from './routes/assessments.js'
import resumeRoutes from './routes/resumes.js'
import aiRoutes from './routes/ai.js'
import careerRoutes from './routes/career.js'
import db from './database/init.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use(express.static(path.join(__dirname, '../dist')))

app.use('/api/auth', authRoutes)
app.use('/api/assessments', assessmentRoutes)
app.use('/api/resumes', resumeRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/career', careerRoutes)

app.get('/api/resume-templates', (_req: Request, res: Response): void => {
  try {
    const rows = db.prepare('SELECT * FROM resume_templates').all() as any[]
    const data = rows.map(row => ({
      ...row,
      style: JSON.parse(row.style || '{}'),
      structure: JSON.parse(row.structure || '{}')
    }))
    res.json({ code: 200, message: '获取成功', data })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

app.use('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({ code: 200, message: 'ok', data: null })
})

app.use((error: Error, _req: Request, res: Response, _next: NextFunction): void => {
  res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
})

app.use((_req: Request, res: Response): void => {
  res.status(404).json({ code: 404, message: 'API not found', data: null })
})

export default app
