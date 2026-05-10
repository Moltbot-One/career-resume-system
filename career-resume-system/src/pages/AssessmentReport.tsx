import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, TrendingUp } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { useAssessmentStore } from '@/stores/assessmentStore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const mbtiDescriptions: Record<string, { title: string; summary: string }> = {
  INTJ: { title: '建筑师型', summary: '你是一个富有想象力和战略性的思考者，一切皆在计划之中。你具有独特的思维方式和深刻的洞察力，善于制定长远规划并坚定地执行。' },
  INTP: { title: '逻辑学家型', summary: '你是一个创新的发明家，对知识有着不可抑制的渴望。你善于发现逻辑不一致之处，喜欢从全局角度思考问题。' },
  ENTJ: { title: '指挥官型', summary: '你是一个大胆、富有想象力的强势领导者，总能找到或创造解决方案。你具有强大的驱动力和组织能力。' },
  ENTP: { title: '辩论家型', summary: '你是一个聪明好奇的思想者，无法抗拒智力上的挑战。你善于从不同角度看问题，喜欢辩论和创新。' },
  INFJ: { title: '提倡者型', summary: '你是一个安静而神秘、同时鼓舞人心且不知疲倦的理想主义者。你具有深刻的洞察力和对他人真挚的关怀。' },
  INFP: { title: '调停者型', summary: '你是一个诗意、善良的利他主义者，总是热心地为正义事业提供帮助。你拥有丰富的内心世界和创造力。' },
  ENFJ: { title: '主人公型', summary: '你是一个富有魅力和鼓舞力的领导者，有感染力的热情能够吸引听众。你善于激励他人实现潜能。' },
  ENFP: { title: '竞选者型', summary: '你是一个热情、有创造力、社交能力强的自由精灵，总能找到理由微笑。你充满好奇心和想象力。' },
  ISTJ: { title: '物流师型', summary: '你是一个实际且注重事实的人，其可靠性无可置疑。你重视传统和秩序，做事有条不紊。' },
  ISFJ: { title: '守卫者型', summary: '你是一个非常专注且温暖的守护者，时刻准备保护所爱的人。你忠诚、勤奋且富有同情心。' },
  ESTJ: { title: '总经理型', summary: '你是一个出色的管理者，在管理事情或人方面无与伦比。你务实、有序且注重规则。' },
  ESFJ: { title: '执政官型', summary: '你是一个非常关心他人的人，善于社交且受欢迎，总是热心帮助他人。你重视和谐与团队合作。' },
  ISTP: { title: '鉴赏家型', summary: '你是一个大胆而实际的实验家，擅长使用各种形式的工具。你冷静理性，善于在危机中找到解决方案。' },
  ISFP: { title: '探险家型', summary: '你是一个灵活而有魅力的艺术家，时刻准备探索和体验新事物。你温和、敏感且富有艺术气质。' },
  ESTP: { title: '企业家型', summary: '你是一个聪明、精力充沛且善于感知的人，真正享受在边缘生活。你果断、务实且适应力强。' },
  ESFP: { title: '表演者型', summary: '你是一个自发、精力充沛且热情的人，生活永远不会在你身边无聊。你乐观、开朗且善于享受当下。' },
};

const hollandDescriptions: Record<string, { title: string; summary: string }> = {
  RIA: { title: '研究-现实-艺术型', summary: '你兼具研究型、现实型和艺术型的特点。你喜欢探索科学问题，同时也享受动手实践和创造性表达。' },
  RIS: { title: '现实-研究-社会型', summary: '你喜欢动手操作，同时关注科学研究和社会服务，适合技术类岗位。' },
  IAR: { title: '研究-艺术-现实型', summary: '你富有创造力和研究精神，喜欢将创意付诸实践。' },
};

function getMbtiDimensions(analysis: Record<string, unknown>) {
  const dims = analysis.dimensions as Record<string, { E?: number; I?: number; S?: number; N?: number; T?: number; F?: number; J?: number; P?: number; result?: string }> || {};
  const result = [];
  if (dims['E/I']) {
    const e = dims['E/I'].E || 0;
    const i = dims['E/I'].I || 0;
    result.push({ name: '外向(E)', score: e * 20, fullMark: 100 });
    result.push({ name: '内向(I)', score: i * 20, fullMark: 100 });
  }
  if (dims['S/N']) {
    const s = dims['S/N'].S || 0;
    const n = dims['S/N'].N || 0;
    result.push({ name: '感觉(S)', score: s * 20, fullMark: 100 });
    result.push({ name: '直觉(N)', score: n * 20, fullMark: 100 });
  }
  if (dims['T/F']) {
    const t = dims['T/F'].T || 0;
    const f = dims['T/F'].F || 0;
    result.push({ name: '思考(T)', score: t * 20, fullMark: 100 });
    result.push({ name: '情感(F)', score: f * 20, fullMark: 100 });
  }
  if (dims['J/P']) {
    const j = dims['J/P'].J || 0;
    const p = dims['J/P'].P || 0;
    result.push({ name: '判断(J)', score: j * 20, fullMark: 100 });
    result.push({ name: '感知(P)', score: p * 20, fullMark: 100 });
  }
  return result;
}

function getHollandDimensions(analysis: Record<string, unknown>) {
  const scores = analysis.scores as Record<string, number> || {};
  const labels: Record<string, string> = { R: '现实型(R)', I: '研究型(I)', A: '艺术型(A)', S: '社会型(S)', E: '企业型(E)', C: '常规型(C)' };
  return Object.entries(scores).map(([key, val]) => ({
    name: labels[key] || key,
    score: val * 20,
    fullMark: 100,
  }));
}

const defaultRecommendations = [
  { title: '软件工程师', match: 90, description: '发挥逻辑思维和技术能力，构建创新产品', skills: ['编程', '系统设计', '问题解决'] },
  { title: '产品经理', match: 85, description: '规划产品路线图，协调团队实现愿景', skills: ['产品规划', '数据分析', '沟通协调'] },
  { title: '数据分析师', match: 80, description: '从数据中挖掘洞察，驱动业务决策', skills: ['统计分析', '数据可视化', '业务理解'] },
];

export default function AssessmentReportPage() {
  const { type } = useParams<{ type: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { report, fetchReport } = useAssessmentStore();

  const assessmentId = searchParams.get('id');

  useEffect(() => {
    if (assessmentId && !report) {
      fetchReport(assessmentId);
    }
  }, [assessmentId]);

  if (!report) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto text-center">
        <p className="text-text-secondary">加载报告中...</p>
        <Button className="mt-4" onClick={() => navigate('/assessment')}>返回测评中心</Button>
      </div>
    );
  }

  const resultCode = report.report?.resultCode || '';
  const analysis = report.report?.analysis || {};
  const recommendations = Array.isArray(report.report?.recommendations) ? report.report.recommendations : defaultRecommendations;

  let dimensions: { name: string; score: number; fullMark: number }[] = [];
  if (type === 'mbti') {
    dimensions = getMbtiDimensions(analysis);
  } else if (type === 'holland') {
    dimensions = getHollandDimensions(analysis);
  }

  const desc = type === 'mbti'
    ? (mbtiDescriptions[resultCode] || { title: resultCode, summary: '你具有独特的性格特征组合，适合多种职业发展方向。' })
    : (hollandDescriptions[resultCode] || { title: resultCode, summary: '你具有独特的职业兴趣组合，适合多种职业发展方向。' });

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/assessment')}
        className="flex items-center gap-2 text-text-secondary hover:text-primary mb-6 text-sm"
      >
        <ArrowLeft size={16} />
        返回测评中心
      </button>

      <Card className="p-8 mb-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full mb-4">
            <TrendingUp size={18} className="text-primary" />
            <span className="text-primary font-medium">测评结果</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-1">{resultCode}</h1>
          <p className="text-lg text-text-secondary">{desc.title}</p>
        </div>
        <p className="text-text-secondary leading-relaxed text-center max-w-lg mx-auto">
          {desc.summary}
        </p>
      </Card>

      {dimensions.length > 0 && (
        <Card className="p-6 mb-6">
          <h3 className="font-semibold text-text-primary mb-4">维度分析</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={dimensions}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="得分"
                  dataKey="score"
                  stroke="#1e3a5f"
                  fill="#1e3a5f"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <h3 className="font-semibold text-text-primary mb-4">职业推荐</h3>
      <div className="space-y-4">
        {recommendations.map((rec: any, index: number) => (
          <Card key={index} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Briefcase size={18} className="text-primary" />
                <h4 className="font-semibold text-text-primary">{rec.title || rec.name || `推荐职业 ${index + 1}`}</h4>
              </div>
              {rec.match && (
                <Badge variant={rec.match >= 90 ? 'success' : rec.match >= 80 ? 'info' : 'default'}>
                  匹配度 {rec.match}%
                </Badge>
              )}
            </div>
            <p className="text-sm text-text-secondary mb-3">{rec.description || ''}</p>
            {rec.skills && (
              <div className="flex flex-wrap gap-2">
                {rec.skills.map((skill: string) => (
                  <span key={skill} className="px-2 py-1 bg-gray-50 text-text-secondary text-xs rounded-md">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
