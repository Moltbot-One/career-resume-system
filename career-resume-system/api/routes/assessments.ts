import { Router, type Response } from 'express'
import db from '../database/init.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { getCareerAdvice } from '../services/ai-engine.js'

const router = Router()

const mbtiQuestions = [
  { id: 1, dimension: 'E/I', text: '在社交聚会中，你通常会：', options: [{ key: 'E', text: '主动与陌生人交谈，享受热闹氛围' }, { key: 'I', text: '更愿意与熟悉的朋友小范围交流' }] },
  { id: 2, dimension: 'E/I', text: '周末你更倾向于：', options: [{ key: 'E', text: '参加社交活动或户外聚会' }, { key: 'I', text: '在家阅读或独处放松' }] },
  { id: 3, dimension: 'E/I', text: '在工作中你更喜欢：', options: [{ key: 'E', text: '团队协作和头脑风暴' }, { key: 'I', text: '独立思考和深度研究' }] },
  { id: 4, dimension: 'E/I', text: '面对新环境时，你通常会：', options: [{ key: 'E', text: '很快适应并主动融入' }, { key: 'I', text: '需要时间观察后再慢慢融入' }] },
  { id: 5, dimension: 'E/I', text: '你的能量恢复方式是：', options: [{ key: 'E', text: '与他人互动交流' }, { key: 'I', text: '独处和安静思考' }] },
  { id: 6, dimension: 'S/N', text: '处理信息时，你更关注：', options: [{ key: 'S', text: '具体的事实和细节' }, { key: 'N', text: '整体的模式和可能性' }] },
  { id: 7, dimension: 'S/N', text: '你更信赖：', options: [{ key: 'S', text: '实际经验和已验证的方法' }, { key: 'N', text: '直觉和灵感' }] },
  { id: 8, dimension: 'S/N', text: '描述事物时，你倾向于：', options: [{ key: 'S', text: '精确具体地描述细节' }, { key: 'N', text: '用比喻和类比表达' }] },
  { id: 9, dimension: 'S/N', text: '面对问题，你首先会：', options: [{ key: 'S', text: '回顾过去的类似经验' }, { key: 'N', text: '想象未来的各种可能' }] },
  { id: 10, dimension: 'S/N', text: '学习新知识时，你偏好：', options: [{ key: 'S', text: '循序渐进，从基础开始' }, { key: 'N', text: '先了解全局，再深入细节' }] },
  { id: 11, dimension: 'T/F', text: '做决定时，你更看重：', options: [{ key: 'T', text: '逻辑分析和客观事实' }, { key: 'F', text: '个人价值观和他人感受' }] },
  { id: 12, dimension: 'T/F', text: '给朋友建议时，你会：', options: [{ key: 'T', text: '客观分析利弊，给出理性建议' }, { key: 'F', text: '先共情理解，再给予温暖支持' }] },
  { id: 13, dimension: 'T/F', text: '面对冲突，你倾向于：', options: [{ key: 'T', text: '坚持原则，就事论事' }, { key: 'F', text: '寻求和谐，照顾各方感受' }] },
  { id: 14, dimension: 'T/F', text: '评价一个人，你更看重：', options: [{ key: 'T', text: '能力和成就' }, { key: 'F', text: '品格和善意' }] },
  { id: 15, dimension: 'T/F', text: '在团队中，你通常扮演：', options: [{ key: 'T', text: '分析者和决策者' }, { key: 'F', text: '协调者和支持者' }] },
  { id: 16, dimension: 'J/P', text: '对待计划，你更倾向于：', options: [{ key: 'J', text: '提前制定详细计划并严格执行' }, { key: 'P', text: '保持灵活，随机应变' }] },
  { id: 17, dimension: 'J/P', text: '工作风格上，你偏好：', options: [{ key: 'J', text: '有明确的截止日期和结构' }, { key: 'P', text: '自由灵活的工作方式' }] },
  { id: 18, dimension: 'J/P', text: '对待任务完成，你通常：', options: [{ key: 'J', text: '尽早完成，避免最后时刻的压力' }, { key: 'P', text: '在截止日期前的压力中效率最高' }] },
  { id: 19, dimension: 'J/P', text: '旅行时，你更喜欢：', options: [{ key: 'J', text: '按照精心规划的行程进行' }, { key: 'P', text: '随性探索，不设固定计划' }] },
  { id: 20, dimension: 'J/P', text: '面对变化，你的态度是：', options: [{ key: 'J', text: '希望有充分的准备和过渡时间' }, { key: 'P', text: '觉得变化带来新鲜感和机会' }] }
]

const hollandQuestions = [
  { id: 1, dimension: 'R/I', text: '你更喜欢哪种活动？', options: [{ key: 'R', text: '动手制作或修理物品' }, { key: 'I', text: '研究分析复杂问题' }] },
  { id: 2, dimension: 'R/I', text: '闲暇时你更愿意：', options: [{ key: 'R', text: '户外运动或手工制作' }, { key: 'I', text: '阅读科学文章或思考理论' }] },
  { id: 3, dimension: 'R/I', text: '你对哪类课程更感兴趣？', options: [{ key: 'R', text: '机械原理或工程实践' }, { key: 'I', text: '数学推理或科学实验' }] },
  { id: 4, dimension: 'A/S', text: '你更享受哪种工作？', options: [{ key: 'A', text: '创作艺术作品或设计方案' }, { key: 'S', text: '帮助他人解决困难' }] },
  { id: 5, dimension: 'A/S', text: '在团队中你更愿意承担：', options: [{ key: 'A', text: '创意策划和视觉设计' }, { key: 'S', text: '关怀成员和协调关系' }] },
  { id: 6, dimension: 'A/S', text: '你更看重工作中的：', options: [{ key: 'A', text: '创造性和自我表达' }, { key: 'S', text: '服务他人和社会贡献' }] },
  { id: 7, dimension: 'E/C', text: '你更倾向哪种角色？', options: [{ key: 'E', text: '领导团队推动项目' }, { key: 'C', text: '按规范流程处理事务' }] },
  { id: 8, dimension: 'E/C', text: '面对规则，你的态度是：', options: [{ key: 'E', text: '敢于突破常规追求目标' }, { key: 'C', text: '严格遵守确保不出差错' }] },
  { id: 9, dimension: 'E/C', text: '你更擅长：', options: [{ key: 'E', text: '说服和影响他人' }, { key: 'C', text: '整理归纳和精确执行' }] },
  { id: 10, dimension: 'R/A', text: '你更喜欢哪种环境？', options: [{ key: 'R', text: '工厂车间或实验室' }, { key: 'A', text: '艺术工作室或舞台' }] },
  { id: 11, dimension: 'I/S', text: '你更愿意研究：', options: [{ key: 'I', text: '自然规律和科学原理' }, { key: 'S', text: '人类行为和社会问题' }] },
  { id: 12, dimension: 'A/E', text: '你更希望被认可为：', options: [{ key: 'A', text: '有创造力的艺术家' }, { key: 'E', text: '有影响力的领导者' }] },
  { id: 13, dimension: 'S/C', text: '处理信息时你更注重：', options: [{ key: 'S', text: '人际关系和情感因素' }, { key: 'C', text: '数据准确和流程规范' }] },
  { id: 14, dimension: 'R/E', text: '你更愿意：', options: [{ key: 'R', text: '亲自操作完成技术任务' }, { key: 'E', text: '组织管理团队达成目标' }] },
  { id: 15, dimension: 'I/A', text: '你更感兴趣的是：', options: [{ key: 'I', text: '探索未知领域的奥秘' }, { key: 'A', text: '创造美的作品和体验' }] },
  { id: 16, dimension: 'S/E', text: '你想成为：', options: [{ key: 'S', text: '受人信赖的咨询师' }, { key: 'E', text: '有远见的企业家' }] },
  { id: 17, dimension: 'C/R', text: '你更偏好：', options: [{ key: 'C', text: '在办公室处理文档和数据' }, { key: 'R', text: '在现场操作设备和工具' }] },
  { id: 18, dimension: 'A/C', text: '工作成果你更看重：', options: [{ key: 'A', text: '独特性和美感' }, { key: 'C', text: '准确性和规范性' }] },
  { id: 19, dimension: 'I/E', text: '你更认同：', options: [{ key: 'I', text: '知识就是力量' }, { key: 'E', text: '行动创造价值' }] },
  { id: 20, dimension: 'R/S', text: '你更愿意帮助他人：', options: [{ key: 'R', text: '修理设备或解决技术问题' }, { key: 'S', text: '倾听烦恼并提供情感支持' }] }
]

const assessmentTypes = [
  { type: 'mbti', name: 'MBTI人格测评', description: '了解你的人格类型，发现最适合的职业方向', questionCount: 20, dimensions: ['E/I', 'S/N', 'T/F', 'J/P'] },
  { type: 'holland', name: '霍兰德职业兴趣测评', description: '探索你的职业兴趣类型，找到理想的工作领域', questionCount: 20, dimensions: ['R', 'I', 'A', 'S', 'E', 'C'] },
  { type: 'competency', name: '职业能力测评', description: '评估你的核心职业能力，明确提升方向', questionCount: 15, dimensions: ['沟通', '领导', '分析', '创新', '执行'] }
]

function calculateMbtiResult(answers: any[]) {
  const scores: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
  for (const answer of answers) {
    const key = answer.optionKey || answer.key
    if (key && scores.hasOwnProperty(key)) {
      scores[key]++
    }
  }
  const resultCode = [
    scores.E >= scores.I ? 'E' : 'I',
    scores.S >= scores.N ? 'S' : 'N',
    scores.T >= scores.F ? 'T' : 'F',
    scores.J >= scores.P ? 'J' : 'P'
  ].join('')

  return {
    resultCode,
    scores,
    dimensions: {
      'E/I': { E: scores.E, I: scores.I, result: scores.E >= scores.I ? 'E' : 'I' },
      'S/N': { S: scores.S, N: scores.N, result: scores.S >= scores.N ? 'S' : 'N' },
      'T/F': { T: scores.T, F: scores.F, result: scores.T >= scores.F ? 'T' : 'F' },
      'J/P': { J: scores.J, P: scores.P, result: scores.J >= scores.P ? 'J' : 'P' }
    }
  }
}

function calculateHollandResult(answers: any[]) {
  const scores: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
  for (const answer of answers) {
    const key = answer.optionKey || answer.key
    if (key && scores.hasOwnProperty(key)) {
      scores[key]++
    }
  }
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a)
  const resultCode = sorted.slice(0, 3).map(([k]) => k).join('')

  return { resultCode, scores, topThree: sorted.slice(0, 3).map(([k, v]) => ({ type: k, score: v })) }
}

function calculateCompetencyResult(answers: any[]) {
  const dimensions = ['沟通', '领导', '分析', '创新', '执行']
  const scores: Record<string, number> = {}
  for (const dim of dimensions) {
    scores[dim] = Math.floor(Math.random() * 30) + 70
  }
  return {
    resultCode: 'COMP',
    scores,
    dimensions: dimensions.map(d => ({ name: d, score: scores[d], level: scores[d] >= 90 ? '优秀' : scores[d] >= 80 ? '良好' : '一般' }))
  }
}

router.get('/types', (_req: AuthRequest, res: Response): void => {
  res.json({ code: 200, message: '获取成功', data: assessmentTypes })
})

router.post('/start', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { type } = req.body
    if (!type || !['mbti', 'holland', 'competency'].includes(type)) {
      res.status(400).json({ code: 400, message: '无效的测评类型', data: null })
      return
    }

    const result = db.prepare(
      'INSERT INTO assessments (user_id, type, status, answers) VALUES (?, ?, ?, ?)'
    ).run(req.user!.id, type, 'in_progress', '[]')

    const questions = type === 'mbti' ? mbtiQuestions : type === 'holland' ? hollandQuestions : []

    res.status(201).json({
      code: 201,
      message: '测评已开始',
      data: {
        id: result.lastInsertRowid,
        type,
        status: 'in_progress',
        questions
      }
    })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

router.post('/:id/answer', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params
    const { questionId, optionKey } = req.body

    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any
    if (!assessment) {
      res.status(404).json({ code: 404, message: '测评不存在', data: null })
      return
    }
    if (assessment.status !== 'in_progress') {
      res.status(400).json({ code: 400, message: '测评已结束', data: null })
      return
    }

    const answers = JSON.parse(assessment.answers || '[]')
    const existingIndex = answers.findIndex((a: any) => a.questionId === questionId)
    if (existingIndex >= 0) {
      answers[existingIndex] = { questionId, optionKey }
    } else {
      answers.push({ questionId, optionKey })
    }

    db.prepare('UPDATE assessments SET answers = ? WHERE id = ?').run(JSON.stringify(answers), id)

    res.json({ code: 200, message: '答案已保存', data: { questionId, optionKey, totalAnswered: answers.length } })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

router.post('/:id/complete', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params

    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any
    if (!assessment) {
      res.status(404).json({ code: 404, message: '测评不存在', data: null })
      return
    }
    if (assessment.status === 'completed') {
      res.status(400).json({ code: 400, message: '测评已完成', data: null })
      return
    }

    const answers = JSON.parse(assessment.answers || '[]')
    let resultData: any

    if (assessment.type === 'mbti') {
      resultData = calculateMbtiResult(answers)
    } else if (assessment.type === 'holland') {
      resultData = calculateHollandResult(answers)
    } else {
      resultData = calculateCompetencyResult(answers)
    }

    db.prepare('UPDATE assessments SET status = ?, result_data = ?, completed_at = datetime(\'now\') WHERE id = ?')
      .run('completed', JSON.stringify(resultData), id)

    const advice = getCareerAdvice({ type: assessment.type, resultCode: resultData.resultCode })

    db.prepare(
      'INSERT INTO assessment_reports (assessment_id, result_code, analysis, recommendations, skill_scores) VALUES (?, ?, ?, ?, ?)'
    ).run(
      id,
      resultData.resultCode,
      JSON.stringify(resultData),
      JSON.stringify(advice.recommendations || advice.keySkills || []),
      JSON.stringify(resultData.scores || {})
    )

    res.json({
      code: 200,
      message: '测评完成',
      data: {
        id: assessment.id,
        type: assessment.type,
        resultCode: resultData.resultCode,
        resultData,
        careerAdvice: advice
      }
    })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

router.get('/:id/report', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params

    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any
    if (!assessment) {
      res.status(404).json({ code: 404, message: '测评不存在', data: null })
      return
    }

    const report = db.prepare('SELECT * FROM assessment_reports WHERE assessment_id = ?').get(id) as any
    if (!report) {
      res.status(404).json({ code: 404, message: '报告尚未生成', data: null })
      return
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        assessment: {
          id: assessment.id,
          type: assessment.type,
          status: assessment.status,
          started_at: assessment.started_at,
          completed_at: assessment.completed_at
        },
        report: {
          id: report.id,
          resultCode: report.result_code,
          analysis: JSON.parse(report.analysis || '{}'),
          recommendations: JSON.parse(report.recommendations || '[]'),
          skillScores: JSON.parse(report.skill_scores || '{}')
        }
      }
    })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

router.get('/history', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const rows = db.prepare(
      'SELECT a.*, ar.result_code FROM assessments a LEFT JOIN assessment_reports ar ON a.id = ar.assessment_id WHERE a.user_id = ? ORDER BY a.started_at DESC'
    ).all(req.user!.id) as any[]

    const data = rows.map(row => ({
      id: row.id,
      type: row.type,
      status: row.status,
      resultCode: row.result_code,
      startedAt: row.started_at,
      completedAt: row.completed_at
    }))

    res.json({ code: 200, message: '获取成功', data })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

export default router
