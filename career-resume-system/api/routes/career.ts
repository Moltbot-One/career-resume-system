import { Router, type Response } from 'express'
import db from '../database/init.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { getCareerAdvice } from '../services/ai-engine.js'

const router = Router()

router.get('/recommendations', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const latestAssessment = db.prepare(
      'SELECT a.*, ar.result_code FROM assessments a LEFT JOIN assessment_reports ar ON a.id = ar.assessment_id WHERE a.user_id = ? AND a.status = ? ORDER BY a.completed_at DESC LIMIT 1'
    ).get(req.user!.id, 'completed') as any

    let recommendations: any[] = []

    if (latestAssessment && latestAssessment.result_code) {
      const advice = getCareerAdvice({
        type: latestAssessment.type,
        resultCode: latestAssessment.result_code
      })
      recommendations = advice.recommendations || []
    } else {
      recommendations = [
        { title: '产品经理', match: 78, description: '综合能力匹配度较高', skills: ['产品规划', '需求分析', '项目管理'] },
        { title: '项目经理', match: 75, description: '组织协调能力突出', skills: ['项目规划', '团队管理', '风险控制'] },
        { title: '数据分析师', match: 72, description: '逻辑思维能力强', skills: ['数据分析', 'SQL', '可视化'] },
        { title: 'UI/UX设计师', match: 70, description: '创造力和用户思维', skills: ['设计工具', '用户研究', '原型设计'] },
        { title: '前端开发工程师', match: 68, description: '技术实现与审美结合', skills: ['HTML/CSS', 'JavaScript', 'React'] }
      ]
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        basedOn: latestAssessment ? `${latestAssessment.type}测评结果` : '通用推荐',
        resultCode: latestAssessment?.result_code || null,
        recommendations
      }
    })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

router.get('/skill-analysis', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const latestAssessment = db.prepare(
      'SELECT a.*, ar.result_code, ar.skill_scores FROM assessments a LEFT JOIN assessment_reports ar ON a.id = ar.assessment_id WHERE a.user_id = ? AND a.status = ? ORDER BY a.completed_at DESC LIMIT 1'
    ).get(req.user!.id, 'completed') as any

    let skillAnalysis: any

    if (latestAssessment) {
      const scores = JSON.parse(latestAssessment.skill_scores || '{}')
      skillAnalysis = {
        assessmentType: latestAssessment.type,
        resultCode: latestAssessment.result_code,
        skills: Object.entries(scores).map(([key, value]) => ({
          name: key,
          score: value,
          level: (value as number) >= 80 ? '优秀' : (value as number) >= 60 ? '良好' : '待提升'
        })),
        suggestions: [
          '发挥优势技能，寻找匹配岗位',
          '针对薄弱环节制定提升计划',
          '关注行业对核心技能的需求变化',
          '通过项目实践巩固技能水平'
        ]
      }
    } else {
      skillAnalysis = {
        assessmentType: null,
        resultCode: null,
        skills: [
          { name: '沟通能力', score: 75, level: '良好' },
          { name: '分析能力', score: 72, level: '良好' },
          { name: '创新能力', score: 68, level: '良好' },
          { name: '领导力', score: 65, level: '良好' },
          { name: '执行力', score: 70, level: '良好' }
        ],
        suggestions: [
          '建议先完成职业测评获取精准分析',
          '持续学习提升核心竞争力',
          '关注行业趋势和技能需求变化'
        ]
      }
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: skillAnalysis
    })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

export default router
