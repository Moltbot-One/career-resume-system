const resumeContentTemplates: Record<string, (prompt: string) => any> = {
  personal: (prompt: string) => ({
    name: '张三',
    title: '高级软件工程师',
    email: 'zhangsan@example.com',
    phone: '138-0000-0000',
    location: '北京市朝阳区',
    linkedin: 'linkedin.com/in/zhangsan',
    website: 'zhangsan.dev'
  }),
  summary: (prompt: string) => ({
    text: `拥有5年以上软件开发经验的全栈工程师，擅长前端技术栈与后端架构设计。具备优秀的团队协作能力和项目管理经验，致力于通过技术创新推动业务增长。${prompt ? '特别关注' + prompt + '领域的发展。' : ''}`
  }),
  experience: (prompt: string) => ({
    items: [
      {
        company: '某科技有限公司',
        title: '高级前端工程师',
        startDate: '2022-03',
        endDate: '至今',
        description: '负责核心产品的前端架构设计与开发，带领团队完成多个重要项目交付。优化了页面加载性能，首屏时间降低40%。'
      },
      {
        company: '某互联网公司',
        title: '前端开发工程师',
        startDate: '2019-07',
        endDate: '2022-02',
        description: '参与公司主要产品的前端开发工作，使用React技术栈构建高性能Web应用。'
      }
    ]
  }),
  education: (prompt: string) => ({
    items: [
      {
        school: '某重点大学',
        degree: '本科',
        major: '计算机科学与技术',
        startDate: '2015-09',
        endDate: '2019-06',
        gpa: '3.8/4.0'
      }
    ]
  }),
  skills: (prompt: string) => ({
    categories: [
      { name: '前端技术', items: ['React', 'TypeScript', 'Vue.js', 'Next.js', 'Tailwind CSS'] },
      { name: '后端技术', items: ['Node.js', 'Python', 'PostgreSQL', 'Redis', 'Docker'] },
      { name: '工具与其他', items: ['Git', 'CI/CD', 'AWS', 'Figma', 'Agile/Scrum'] }
    ]
  }),
  projects: (prompt: string) => ({
    items: [
      {
        name: '智能数据分析平台',
        role: '前端负责人',
        startDate: '2023-01',
        endDate: '2023-08',
        description: '设计并开发了企业级数据分析平台，支持多维度数据可视化与智能报表生成，服务超过100家企业客户。'
      }
    ]
  }),
  certifications: (prompt: string) => ({
    items: [
      { name: 'AWS Solutions Architect', date: '2023-06', issuer: 'Amazon Web Services' },
      { name: 'PMP项目管理认证', date: '2022-12', issuer: 'PMI' }
    ]
  }),
  awards: (prompt: string) => ({
    items: [
      { name: '年度最佳技术创新奖', date: '2023', issuer: '某科技有限公司' }
    ]
  }),
  research: (prompt: string) => ({
    items: [
      {
        title: '基于深度学习的自然语言处理研究',
        journal: '计算机科学',
        date: '2022',
        description: '提出了一种改进的注意力机制，在多个NLP基准测试中取得了优异表现。'
      }
    ]
  }),
  publications: (prompt: string) => ({
    items: [
      {
        title: 'Efficient Transformer Architectures for NLP Tasks',
        journal: 'ACL 2022',
        date: '2022-07',
        authors: '张三, 李四, 王五'
      }
    ]
  })
}

const optimizeTemplates: Record<string, (content: any) => any> = {
  summary: (content: any) => {
    const text = typeof content === 'object' ? content.text || '' : String(content)
    return {
      optimized: text
        .replace(/负责/g, '主导')
        .replace(/参与/g, '深度参与')
        .replace(/完成/g, '高效交付')
        .replace(/使用/g, '熟练运用')
        .replace(/了解/g, '精通'),
      suggestions: [
        '建议使用更具体的量化数据来增强说服力',
        '可以添加关键成就和业务影响',
        '建议突出与目标岗位最相关的技能和经验'
      ]
    }
  },
  experience: (content: any) => {
    const items = Array.isArray(content?.items) ? content.items : []
    return {
      optimized: {
        items: items.map((item: any) => ({
          ...item,
          description: item.description
            ?.replace(/负责/g, '主导')
            .replace(/参与/g, '深度参与')
            .replace(/完成/g, '高效交付')
            .replace(/优化了/g, '成功优化')
        }))
      },
      suggestions: [
        '建议在每段经历中添加2-3个量化成果',
        '使用STAR法则描述项目经验',
        '突出领导力和跨部门协作经验'
      ]
    }
  },
  skills: (content: any) => {
    return {
      optimized: content,
      suggestions: [
        '建议根据目标岗位调整技能排列顺序',
        '添加技能熟练度等级标识',
        '优先展示与职位描述匹配的技能'
      ]
    }
  }
}

const careerAdviceMap: Record<string, any> = {
  INTJ: { title: '策略建筑师', strengths: ['战略思维', '独立分析', '系统规划'], careers: ['架构师', '战略顾问', '研究员', 'CTO'], development: ['加强沟通协作能力', '培养团队领导力', '关注行业前沿趋势'] },
  INTP: { title: '逻辑学家', strengths: ['逻辑分析', '创新思维', '问题解决'], careers: ['算法工程师', '数据科学家', '研究员', '技术顾问'], development: ['提升项目落地能力', '加强时间管理', '培养商业思维'] },
  ENTJ: { title: '指挥官', strengths: ['领导力', '战略规划', '决策力'], careers: ['CEO', '产品总监', '管理顾问', '创业者'], development: ['培养倾听能力', '关注团队情感需求', '学会放权'] },
  ENTP: { title: '辩论家', strengths: ['创新思维', '适应力', '说服力'], careers: ['创业者', '产品经理', '咨询顾问', '设计师'], development: ['提升执行力', '专注深耕领域', '加强项目管理'] },
  INFJ: { title: '提倡者', strengths: ['洞察力', '同理心', '理想主义'], careers: ['心理咨询师', '作家', 'HR专家', '教育工作者'], development: ['设定合理边界', '避免过度理想化', '培养商业敏感度'] },
  INFP: { title: '调停者', strengths: ['创造力', '同理心', '价值观驱动'], careers: ['作家', '设计师', '心理咨询师', '社会工作者'], development: ['提升抗压能力', '加强目标管理', '培养务实思维'] },
  ENFJ: { title: '主人公', strengths: ['领导力', '同理心', '组织能力'], careers: ['培训师', 'HR总监', '项目经理', '教育管理者'], development: ['学会拒绝', '避免过度付出', '培养分析思维'] },
  ENFP: { title: '竞选者', strengths: ['创造力', '热情', '适应力'], careers: ['创意总监', '记者', '心理咨询师', '创业者'], development: ['提升专注力', '加强执行落地', '培养时间管理'] },
  ISTJ: { title: '物流师', strengths: ['可靠性', '组织力', '责任心'], careers: ['审计师', '项目经理', '系统管理员', '会计师'], development: ['培养灵活思维', '尝试创新方法', '加强人际沟通'] },
  ISFJ: { title: '守卫者', strengths: ['可靠性', '耐心', '服务精神'], careers: ['护士', '行政经理', '教师', '社会工作者'], development: ['学会表达需求', '尝试新挑战', '培养领导力'] },
  ESTJ: { title: '总经理', strengths: ['组织力', '执行力', '领导力'], careers: ['运营总监', '项目经理', '财务经理', '军官'], development: ['培养同理心', '接受不同观点', '学会灵活变通'] },
  ESFJ: { title: '执政官', strengths: ['社交能力', '责任心', '合作精神'], careers: ['HR经理', '销售经理', '活动策划', '医疗管理者'], development: ['培养独立判断', '避免过度迎合', '学会处理冲突'] },
  ISTP: { title: '鉴赏家', strengths: ['实践能力', '分析力', '适应力'], careers: ['工程师', '技术专家', '飞行员', '数据分析师'], development: ['加强沟通表达', '培养长期规划', '关注团队协作'] },
  ISFP: { title: '探险家', strengths: ['审美力', '灵活性', '和谐感'], careers: ['设计师', '艺术家', '厨师', '理疗师'], development: ['提升目标感', '加强时间管理', '培养表达能力'] },
  ESTP: { title: '企业家', strengths: ['行动力', '适应力', '社交力'], careers: ['销售总监', '创业者', '运动员', '急诊医生'], development: ['培养长期思维', '加强风险管理', '提升倾听能力'] },
  ESFP: { title: '表演者', strengths: ['表现力', '社交力', '乐观精神'], careers: ['演员', '活动策划', '销售', '旅游顾问'], development: ['培养深度思考', '加强自律', '提升规划能力'] }
}

const hollandAdviceMap: Record<string, any> = {
  R: { name: '现实型', description: '偏好操作性、机械性、体力性的活动', careers: ['工程师', '技术员', '建筑师', '农艺师'] },
  I: { name: '研究型', description: '偏好观察、学习、研究分析的活动', careers: ['科学家', '研究员', '数据分析师', '医生'] },
  A: { name: '艺术型', description: '偏好创造性、想象性、表达性的活动', careers: ['设计师', '作家', '音乐家', '导演'] },
  S: { name: '社会型', description: '偏好帮助、培训、服务他人的活动', careers: ['教师', '咨询师', '社会工作者', '护士'] },
  E: { name: '企业型', description: '偏好影响、领导、说服他人的活动', careers: ['企业家', '经理', '律师', '销售总监'] },
  C: { name: '常规型', description: '偏好有序、规范、数据处理的活动', careers: ['会计师', '审计师', '行政人员', '银行职员'] }
}

const chatResponsePatterns: Array<{ patterns: string[]; response: string }> = [
  {
    patterns: ['简历', 'resume'],
    response: '关于简历优化，我建议您：1) 使用量化数据展示成果；2) 根据目标岗位调整关键词；3) 采用STAR法则描述经历；4) 确保格式简洁专业。需要我帮您生成或优化某个具体部分吗？'
  },
  {
    patterns: ['面试', 'interview'],
    response: '面试准备建议：1) 研究公司背景和岗位需求；2) 准备3-5个核心项目经历的STAR描述；3) 练习常见行为面试题；4) 准备2-3个向面试官提问的问题。需要针对特定岗位的面试建议吗？'
  },
  {
    patterns: ['职业', 'career', '规划'],
    response: '职业规划建议：1) 明确短期和长期目标；2) 评估当前技能与目标的差距；3) 制定学习和发展计划；4) 建立行业人脉网络。建议先完成职业测评，我可以根据您的特点给出更精准的建议。'
  },
  {
    patterns: ['技能', 'skill', '学习'],
    response: '技能提升建议：1) 确定目标岗位的核心技能要求；2) 优先学习高价值、高需求的技能；3) 通过项目实践巩固学习成果；4) 考虑获取相关认证增加竞争力。需要我为您分析某个具体方向吗？'
  },
  {
    patterns: ['薪资', 'salary', '工资'],
    response: '薪资谈判建议：1) 提前调研市场薪资水平；2) 准备好展示自己的价值贡献；3) 考虑整体薪酬包（基本工资+奖金+股权+福利）；4) 选择合适的谈判时机。需要了解某个岗位的薪资范围吗？'
  }
]

export function generateResumeContent(sectionType: string, prompt: string): any {
  const generator = resumeContentTemplates[sectionType]
  if (generator) {
    return {
      sectionType,
      content: generator(prompt),
      generatedAt: new Date().toISOString()
    }
  }
  return {
    sectionType,
    content: { text: prompt || '请补充相关内容' },
    generatedAt: new Date().toISOString()
  }
}

export function optimizeResumeContent(sectionType: string, content: any): any {
  const optimizer = optimizeTemplates[sectionType]
  if (optimizer) {
    return optimizer(content)
  }
  return {
    optimized: content,
    suggestions: ['建议使用更专业的表述', '添加量化数据增强说服力', '确保内容与目标岗位匹配']
  }
}

export function chatResponse(message: string, context: any = {}): any {
  const lowerMessage = message.toLowerCase()

  for (const pattern of chatResponsePatterns) {
    if (pattern.patterns.some(p => lowerMessage.includes(p))) {
      return {
        reply: pattern.response,
        suggestions: ['了解更多详情', '获取个性化建议', '查看相关资源'],
        timestamp: new Date().toISOString()
      }
    }
  }

  if (context.assessmentResult) {
    const advice = getCareerAdvice(context.assessmentResult)
    return {
      reply: `根据您的测评结果（${context.assessmentResult.resultCode}），${advice.summary}。建议您重点关注${advice.keySkills.slice(0, 3).join('、')}等方向的发展。`,
      suggestions: ['查看详细职业推荐', '制定发展计划', '匹配相关课程'],
      timestamp: new Date().toISOString()
    }
  }

  return {
    reply: `感谢您的提问！作为您的职业发展助手，我可以帮您：1) 优化简历内容；2) 提供面试建议；3) 规划职业发展路径；4) 分析技能提升方向。请告诉我您最想了解哪个方面？`,
    suggestions: ['简历优化', '面试准备', '职业规划', '技能提升'],
    timestamp: new Date().toISOString()
  }
}

export function getCareerAdvice(assessmentResult: any): any {
  const resultCode = assessmentResult.resultCode || assessmentResult.result_code || ''

  if (assessmentResult.type === 'mbti' || resultCode.length === 4) {
    const advice = careerAdviceMap[resultCode] || {
      title: '综合型人才',
      strengths: ['适应力', '学习能力', '沟通能力'],
      careers: ['产品经理', '项目经理', '咨询顾问', '运营经理'],
      development: ['明确职业方向', '深耕专业领域', '建立个人品牌']
    }
    return {
      resultCode,
      personalityType: advice.title,
      summary: `您属于${advice.title}类型，具有${advice.strengths.join('、')}等优势特质`,
      keySkills: advice.careers,
      recommendations: advice.careers.map((career: string) => ({
        career,
        matchScore: Math.floor(Math.random() * 20) + 80,
        reason: `与您的${advice.strengths[0]}和${advice.strengths[1]}特质高度匹配`
      })),
      developmentPlan: advice.development,
      industryTrends: ['数字化转型加速', 'AI技术广泛应用', '远程办公常态化', '跨领域复合型人才需求增长']
    }
  }

  if (assessmentResult.type === 'holland' || /^[RIASEC]{2,3}$/.test(resultCode)) {
    const types = resultCode.split('')
    const primary = hollandAdviceMap[types[0]] || hollandAdviceMap['R']
    const secondary = hollandAdviceMap[types[1]] || hollandAdviceMap['I']
    return {
      resultCode,
      personalityType: `${primary.name}-${secondary.name}型`,
      summary: `您的职业兴趣倾向为${primary.name}和${secondary.name}，${primary.description}`,
      keySkills: [...primary.careers, ...secondary.careers].slice(0, 6),
      recommendations: [...primary.careers, ...secondary.careers].slice(0, 6).map((career: string) => ({
        career,
        matchScore: Math.floor(Math.random() * 20) + 75,
        reason: `与您的${primary.name}和${secondary.name}兴趣倾向匹配`
      })),
      developmentPlan: [`深耕${primary.name}领域专业能力`, `发展${secondary.name}方向作为补充`, '探索两个领域的交叉机会'],
      industryTrends: ['行业边界逐渐模糊', '复合型人才更受青睐', '新兴职业不断涌现']
    }
  }

  return {
    resultCode,
    personalityType: '综合型',
    summary: '您具有多元化的职业发展潜力',
    keySkills: ['项目管理', '团队协作', '问题解决', '创新思维'],
    recommendations: [
      { career: '产品经理', matchScore: 85, reason: '综合能力匹配度高' },
      { career: '项目经理', matchScore: 82, reason: '组织协调能力突出' },
      { career: '咨询顾问', matchScore: 80, reason: '分析沟通能力优秀' }
    ],
    developmentPlan: ['明确核心优势', '制定阶段性目标', '持续学习提升'],
    industryTrends: ['数字化转型', 'AI赋能', '远程协作']
  }
}

export function scoreResume(sections: any[]): any {
  let totalScore = 0
  const maxScore = 100
  const details: any[] = []

  const sectionMap: Record<string, number> = {}
  for (const section of sections) {
    sectionMap[section.section_type || section.sectionType] = section.content ? 1 : 0
  }

  const requiredSections = ['personal', 'summary', 'experience', 'education', 'skills']
  const optionalSections = ['projects', 'certifications', 'awards', 'publications', 'research']

  let requiredScore = 0
  for (const req of requiredSections) {
    if (sectionMap[req]) {
      requiredScore += 10
    } else {
      details.push({ section: req, score: 0, maxScore: 10, suggestion: `建议添加${req}部分` })
    }
  }
  totalScore += Math.min(requiredScore, 50)

  let optionalScore = 0
  for (const opt of optionalSections) {
    if (sectionMap[opt]) {
      optionalScore += 5
    }
  }
  totalScore += Math.min(optionalScore, 20)

  let contentScore = 0
  for (const section of sections) {
    const content = section.content
    if (content) {
      const contentStr = JSON.stringify(content)
      if (contentStr.length > 100) contentScore += 3
      if (contentStr.length > 300) contentScore += 2
      if (/\d+%|\d+万|\d+个|\d+次|\d+年/.test(contentStr)) contentScore += 5
    }
  }
  totalScore += Math.min(contentScore, 30)

  totalScore = Math.min(totalScore, maxScore)

  const level = totalScore >= 80 ? '优秀' : totalScore >= 60 ? '良好' : totalScore >= 40 ? '一般' : '需改进'

  return {
    totalScore,
    level,
    details,
    suggestions: [
      ...(totalScore < 50 ? ['建议完善基本信息和核心经历'] : []),
      ...(totalScore < 70 ? ['添加量化成果数据增强说服力'] : []),
      ...(totalScore < 90 ? ['优化关键词匹配目标岗位'] : []),
      '确保内容真实准确',
      '定期更新简历内容'
    ],
    scoredAt: new Date().toISOString()
  }
}
