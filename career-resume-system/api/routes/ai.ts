import { Router, type Response } from 'express'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { chatResponse } from '../services/ai-engine.js'

const router = Router()

router.post('/chat', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { message, context } = req.body

    if (!message) {
      res.status(400).json({ code: 400, message: '请输入消息内容', data: null })
      return
    }

    const result = chatResponse(message, context || {})

    res.json({
      code: 200,
      message: '回复成功',
      data: result
    })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

router.get('/career-advice', authMiddleware, (req: AuthRequest, res: Response): void => {
  try {
    const { type, resultCode } = req.query

    const advice = {
      general: [
        { category: '职业发展', tips: ['持续学习新技术和行业知识', '建立个人专业品牌', '拓展行业人脉网络', '定期评估职业目标'] },
        { category: '技能提升', tips: ['识别核心技能差距', '制定系统学习计划', '通过项目实践巩固', '获取相关行业认证'] },
        { category: '求职策略', tips: ['针对性优化简历', '提前准备面试案例', '研究目标公司文化', '善用内推渠道'] }
      ],
      trends: [
        'AI和自动化正在重塑各行各业',
        '远程办公和混合办公模式常态化',
        '跨领域复合型人才需求增长',
        '数据驱动决策能力成为核心竞争力'
      ]
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: advice
    })
  } catch (error) {
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null })
  }
})

export default router
