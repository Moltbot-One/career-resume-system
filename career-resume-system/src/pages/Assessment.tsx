import { useNavigate } from 'react-router-dom';
import { Brain, Compass, Target } from 'lucide-react';
import type { AssessmentType } from '@/shared/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const assessmentList: {
  type: AssessmentType;
  title: string;
  desc: string;
  icon: typeof Brain;
  color: string;
  duration: string;
}[] = [
  {
    type: 'mbti',
    title: 'MBTI 性格测评',
    desc: '了解你的性格类型，发现最适合你的工作环境和团队角色',
    icon: Brain,
    color: 'bg-blue-50 text-blue-600',
    duration: '约15分钟',
  },
  {
    type: 'holland',
    title: '霍兰德兴趣测评',
    desc: '探索你的职业兴趣类型，找到与兴趣匹配的职业方向',
    icon: Compass,
    color: 'bg-accent-50 text-accent',
    duration: '约10分钟',
  },
  {
    type: 'competency',
    title: '能力评估',
    desc: '全面评估你的核心能力，了解你的优势和发展空间',
    icon: Target,
    color: 'bg-green-50 text-green-600',
    duration: '约20分钟',
  },
];

export default function Assessment() {
  const navigate = useNavigate();

  const handleStart = (type: AssessmentType) => {
    navigate(`/assessment/${type}`);
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">测评中心</h1>
        <p className="text-text-secondary mt-1">通过专业测评，深入了解你的职业潜力</p>
      </div>

      <div className="space-y-6">
        {assessmentList.map((item) => (
          <Card key={item.type} className="p-6">
            <div className="flex items-start gap-5">
              <div className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
                <item.icon size={28} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary mb-1">{item.title}</h3>
                <p className="text-text-secondary text-sm mb-3">{item.desc}</p>
                <p className="text-xs text-text-secondary mb-4">⏱ {item.duration}</p>
                <Button onClick={() => handleStart(item.type)}>开始测评</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
