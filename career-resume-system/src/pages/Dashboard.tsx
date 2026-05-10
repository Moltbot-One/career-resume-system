import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, ClipboardCheck, Bot, Plus, Brain, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useResumeStore } from '@/stores/resumeStore';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export default function Dashboard() {
  const { user, checkAuth } = useAuthStore();
  const { resumes, fetchResumes } = useResumeStore();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchResumes();
  }, [checkAuth, fetchResumes]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';

  const quickActions = [
    {
      icon: FileText,
      label: '创建简历',
      desc: '使用AI辅助创建专业简历',
      color: 'bg-blue-50 text-blue-600',
      onClick: () => navigate('/resumes'),
    },
    {
      icon: ClipboardCheck,
      label: '开始测评',
      desc: '探索你的职业性格与兴趣',
      color: 'bg-accent-50 text-accent',
      onClick: () => navigate('/assessment'),
    },
    {
      icon: Bot,
      label: '咨询AI',
      desc: '获取职业建议与面试辅导',
      color: 'bg-green-50 text-green-600',
      onClick: () => navigate('/assistant'),
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">
          {greeting}，{user?.username || '用户'} 👋
        </h1>
        <p className="text-text-secondary mt-1">欢迎回到 CareerAI，今天想做些什么？</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{resumes.length}</p>
              <p className="text-sm text-text-secondary">我的简历</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center">
              <Brain size={24} className="text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">0</p>
              <p className="text-sm text-text-secondary">测评完成</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <Sparkles size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">0</p>
              <p className="text-sm text-text-secondary">AI使用次数</p>
            </div>
          </div>
        </Card>
      </div>

      <h2 className="text-lg font-semibold text-text-primary mb-4">快捷操作</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {quickActions.map((action) => (
          <Card
            key={action.label}
            hover
            className="p-6"
            onClick={action.onClick}
          >
            <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-4`}>
              <action.icon size={24} />
            </div>
            <h3 className="font-semibold text-text-primary mb-1">{action.label}</h3>
            <p className="text-sm text-text-secondary">{action.desc}</p>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">最近活动</h2>
        <Link to="/resumes" className="text-sm text-accent hover:text-accent-600">
          查看全部
        </Link>
      </div>
      {resumes.length > 0 ? (
        <div className="space-y-3">
          {resumes.slice(0, 5).map((resume) => (
            <Card key={resume.id} className="p-4 flex items-center justify-between" hover onClick={() => navigate(`/resumes/${resume.id}`)}>
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-primary" />
                <div>
                  <p className="font-medium text-text-primary">{resume.title}</p>
                  <p className="text-xs text-text-secondary">
                    更新于 {new Date(resume.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge variant={resume.status === 'completed' ? 'success' : 'warning'}>
                {resume.status === 'completed' ? '已完成' : '草稿'}
              </Badge>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Plus size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-text-secondary mb-3">还没有简历，创建你的第一份简历吧</p>
          <Link to="/resumes">
            <button className="text-accent hover:text-accent-600 text-sm font-medium">
              创建简历 →
            </button>
          </Link>
        </Card>
      )}
    </div>
  );
}
