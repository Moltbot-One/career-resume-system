import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Briefcase, Target, TrendingUp, Clock } from 'lucide-react';
import { api } from '@/utils/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface CareerRecommendation {
  title: string;
  match: number;
  description: string;
  skills: string[];
}

interface SkillItem {
  name: string;
  score: number;
  level: string;
}

const mockTimeline = [
  { period: '1-3个月', title: '夯实基础', items: ['深入学习核心技能', '参与实际项目积累经验', '建立专业知识体系'] },
  { period: '3-6个月', title: '拓展能力', items: ['学习跨领域知识', '承担更多责任', '拓展职业人脉'] },
  { period: '6-12个月', title: '突破提升', items: ['独立负责项目', '提升沟通和管理能力', '准备职业晋升'] },
  { period: '1-2年', title: '职业跃迁', items: ['晋升到更高职位', '建立个人品牌', '拓展行业影响力'] },
];

export default function Career() {
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [basedOn, setBasedOn] = useState<string>('通用推荐');

  useEffect(() => {
    api.get<{ basedOn: string; resultCode: string | null; recommendations: CareerRecommendation[] }>('/career/recommendations')
      .then(data => {
        setRecommendations(data.recommendations || []);
        setBasedOn(data.basedOn || '通用推荐');
      })
      .catch(() => {});

    api.get<{ skills: SkillItem[] }>('/career/skill-analysis')
      .then(data => {
        setSkills(data.skills || []);
      })
      .catch(() => {});
  }, []);

  const skillChartData = skills.map(s => ({
    skill: s.name,
    current: s.score,
    required: Math.min(s.score + 20, 100),
  }));

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">职业规划</h1>
        <p className="text-text-secondary mt-1">基于{basedOn}，为你量身定制职业发展路径</p>
      </div>

      <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        <Briefcase size={20} className="text-primary" />
        职业推荐
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {recommendations.map((rec) => (
          <Card key={rec.title} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-text-primary">{rec.title}</h3>
              <Badge variant={rec.match >= 90 ? 'success' : rec.match >= 80 ? 'info' : 'default'}>
                匹配 {rec.match}%
              </Badge>
            </div>
            <p className="text-sm text-text-secondary mb-3">{rec.description}</p>
            {rec.skills && (
              <div className="flex flex-wrap gap-2">
                {rec.skills.map((skill) => (
                  <span key={skill} className="px-2 py-1 bg-gray-50 text-text-secondary text-xs rounded-md">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {skillChartData.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Target size={20} className="text-accent" />
            技能差距分析
          </h2>
          <Card className="p-6 mb-10">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillChartData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="skill" type="category" tick={{ fontSize: 12, fill: '#6b7280' }} width={80} />
                  <Tooltip />
                  <Bar dataKey="current" name="当前水平" fill="#1e3a5f" radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar dataKey="required" name="目标水平" fill="#ff6b35" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary" />
                <span className="text-xs text-text-secondary">当前水平</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-accent" />
                <span className="text-xs text-text-secondary">目标水平</span>
              </div>
            </div>
          </Card>
        </>
      )}

      <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        <TrendingUp size={20} className="text-green-600" />
        发展建议时间线
      </h2>
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
        <div className="space-y-8">
          {mockTimeline.map((phase, index) => (
            <div key={phase.period} className="relative pl-16">
              <div className="absolute left-4 top-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white text-xs font-bold">{index + 1}</span>
              </div>
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="info">
                    <Clock size={12} className="mr-1" />
                    {phase.period}
                  </Badge>
                  <h3 className="font-semibold text-text-primary">{phase.title}</h3>
                </div>
                <ul className="space-y-2">
                  {phase.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-primary mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
