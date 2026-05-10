import { Router, type Response } from 'express'
import db from '../database/init.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { generateResumeContent, optimizeResumeContent, scoreResume } from '../services/ai-engine.js'

const router = Router()

const defaultSections = [
  { sectionType: 'basic', sectionOrder: 1, content: '{"name":"","phone":"","email":"","address":"","objective":""}' },
  { sectionType: 'education', sectionOrder: 2, content: '{"school":"","major":"","degree":"","startDate":"","endDate":""}' },
  { sectionType: 'work', sectionOrder: 3, content: '{"company":"","position":"","startDate":"","endDate":"","description":""}' },
  { sectionType: 'project', sectionOrder: 4, content: '{"name":"","role":"","startDate":"","endDate":"","description":""}' },
  { sectionType: 'skill', sectionOrder: 5, content: '{"name":"","proficiency":50}' },
  { sectionType: 'self_eval', sectionOrder: 6, content: '{"text":""}' }
]

router.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const rows = db.prepare(
      'SELECT * FROM resumes WHERE user_id = ? ORDER BY updated_at DESC'
    ).all(req.user!.id) as any[]

    const data = rows.map(row => ({
      ...row,
      ai_optimized: !!row.ai_optimized
    }))

    res.json({ code: 200, message: '获取成功', data })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

router.post('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { title, templateId, template_id } = req.body

    if (!title) {
      res.status(400).json({ code: 400, message: '请填写简历标题', data: null })
      return
    }

    const tid = templateId || template_id || 1
    const result = db.prepare(
      'INSERT INTO resumes (user_id, template_id, title, status, completeness_score) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user!.id, tid, title, 'draft', 0)

    const resumeId = result.lastInsertRowid

    const insertSection = db.prepare(
      'INSERT INTO resume_sections (resume_id, section_type, section_order, content) VALUES (?, ?, ?, ?)'
    )

    const insertSections = db.transaction(() => {
      for (const section of defaultSections) {
        insertSection.run(resumeId, section.sectionType, section.sectionOrder, section.content)
      }
    })

    insertSections()

    const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(resumeId) as any
    const sections = db.prepare('SELECT * FROM resume_sections WHERE resume_id = ? ORDER BY section_order').all(resumeId) as any[]

    res.status(201).json({
      code: 201,
      message: '简历创建成功',
      data: {
        ...resume,
        ai_optimized: !!resume.ai_optimized,
        sections: sections.map(s => ({
          ...s,
          content: JSON.parse(s.content || '{}'),
          ai_suggestions: JSON.parse(s.ai_suggestions || '{}')
        }))
      }
    })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

router.get('/templates', (_req: AuthRequest, res: Response): void => {
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

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const resume = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any
    if (!resume) {
      res.status(404).json({ code: 404, message: '简历不存在', data: null })
      return
    }

    const sections = db.prepare('SELECT * FROM resume_sections WHERE resume_id = ? ORDER BY section_order').all(req.params.id) as any[]

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        ...resume,
        ai_optimized: !!resume.ai_optimized,
        sections: sections.map(s => ({
          ...s,
          content: JSON.parse(s.content || '{}'),
          ai_suggestions: JSON.parse(s.ai_suggestions || '{}')
        }))
      }
    })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

router.put('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params
    const { title, template_id, status, sections } = req.body

    const resume = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any
    if (!resume) {
      res.status(404).json({ code: 404, message: '简历不存在', data: null })
      return
    }

    if (title !== undefined || template_id !== undefined || status !== undefined) {
      const updates: string[] = []
      const values: any[] = []

      if (title !== undefined) { updates.push('title = ?'); values.push(title) }
      if (template_id !== undefined) { updates.push('template_id = ?'); values.push(template_id) }
      if (status !== undefined) { updates.push('status = ?'); values.push(status) }

      if (updates.length > 0) {
        updates.push("updated_at = datetime('now')")
        values.push(id)
        db.prepare(`UPDATE resumes SET ${updates.join(', ')} WHERE id = ?`).run(...values)
      }
    }

    if (sections && Array.isArray(sections)) {
      const updateSection = db.prepare(
        'UPDATE resume_sections SET content = ? WHERE id = ? AND resume_id = ?'
      )
      for (const section of sections) {
        updateSection.run(
          typeof section.content === 'string' ? section.content : JSON.stringify(section.content),
          section.id,
          id
        )
      }
    }

    const updated = db.prepare('SELECT * FROM resumes WHERE id = ?').get(id) as any
    const updatedSections = db.prepare('SELECT * FROM resume_sections WHERE resume_id = ? ORDER BY section_order').all(id) as any[]

    res.json({
      code: 200,
      message: '更新成功',
      data: {
        ...updated,
        ai_optimized: !!updated.ai_optimized,
        sections: updatedSections.map(s => ({
          ...s,
          content: JSON.parse(s.content || '{}'),
          ai_suggestions: JSON.parse(s.ai_suggestions || '{}')
        }))
      }
    })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const resume = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any
    if (!resume) {
      res.status(404).json({ code: 404, message: '简历不存在', data: null })
      return
    }

    db.prepare('DELETE FROM resume_sections WHERE resume_id = ?').run(req.params.id)
    db.prepare('DELETE FROM resumes WHERE id = ?').run(req.params.id)

    res.json({ code: 200, message: '删除成功', data: null })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

router.post('/:id/ai-generate', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params
    const { sectionType, prompt } = req.body

    if (!sectionType) {
      res.status(400).json({ code: 400, message: '请指定要生成的部分类型', data: null })
      return
    }

    const resume = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any
    if (!resume) {
      res.status(404).json({ code: 404, message: '简历不存在', data: null })
      return
    }

    const generated = generateResumeContent(sectionType, prompt || '')

    const section = db.prepare('SELECT * FROM resume_sections WHERE resume_id = ? AND section_type = ?').get(id, sectionType) as any
    if (section) {
      db.prepare('UPDATE resume_sections SET ai_suggestions = ? WHERE id = ?').run(
        JSON.stringify(generated.content),
        section.id
      )
    } else {
      db.prepare(
        'INSERT INTO resume_sections (resume_id, section_type, section_order, content, ai_suggestions) VALUES (?, ?, ?, ?, ?)'
      ).run(id, sectionType, 99, '{}', JSON.stringify(generated.content))
    }

    res.json({
      code: 200,
      message: 'AI内容生成成功',
      data: generated
    })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

router.post('/:id/ai-optimize', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params
    const { sectionType } = req.body

    if (!sectionType) {
      res.status(400).json({ code: 400, message: '请指定要优化的部分类型', data: null })
      return
    }

    const resume = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any
    if (!resume) {
      res.status(404).json({ code: 404, message: '简历不存在', data: null })
      return
    }

    const section = db.prepare('SELECT * FROM resume_sections WHERE resume_id = ? AND section_type = ?').get(id, sectionType) as any
    if (!section) {
      res.status(404).json({ code: 404, message: '该部分不存在', data: null })
      return
    }

    const content = JSON.parse(section.content || '{}')
    const optimized = optimizeResumeContent(sectionType, content)

    db.prepare('UPDATE resume_sections SET content = ?, ai_suggestions = ? WHERE id = ?').run(
      JSON.stringify(optimized.optimized),
      JSON.stringify({ suggestions: optimized.suggestions }),
      section.id
    )

    db.prepare("UPDATE resumes SET ai_optimized = 1, updated_at = datetime('now') WHERE id = ?").run(id)

    res.json({
      code: 200,
      message: 'AI优化成功',
      data: optimized
    })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

router.get('/:id/score', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params

    const resume = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any
    if (!resume) {
      res.status(404).json({ code: 404, message: '简历不存在', data: null })
      return
    }

    const sections = db.prepare('SELECT * FROM resume_sections WHERE resume_id = ? ORDER BY section_order').all(id) as any[]

    const parsedSections = sections.map(s => ({
      ...s,
      content: JSON.parse(s.content || '{}'),
      ai_suggestions: JSON.parse(s.ai_suggestions || '{}')
    }))

    const scoreResult = scoreResume(parsedSections)

    db.prepare('UPDATE resumes SET completeness_score = ? WHERE id = ?').run(scoreResult.totalScore, id)

    res.json({
      code: 200,
      message: '评分完成',
      data: scoreResult
    })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

export default router
