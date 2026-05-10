import { Link } from 'react-router-dom';
import { Bot, ClipboardCheck, FileText, Users, FileBarChart, Star, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

const features = [
  {
    icon: ClipboardCheck,
    title: '职业测评',
    desc: 'MBTI、霍兰德等专业测评工具，深度解析你的职业性格与兴趣倾向',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: FileText,
    title: '智能简历',
    desc: 'AI驱动的简历编辑器，一键优化内容，智能匹配岗位需求',
    color: 'bg-accent-50 text-accent',
  },
  {
    icon: Bot,
    title: 'AI助手',
    desc: '7×24小时在线的职业顾问，提供面试辅导、职业规划等全方位支持',
    color: 'bg-green-50 text-green-600',
  },
];

const stats = [
  { value: '50,000+', label: '注册用户' },
  { value: '120,000+', label: '创建简历' },
  { value: '98%', label: '用户好评' },
  { value: '200+', label: '合作企业' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Bot className="text-accent" size={28} />
            <span className="text-primary font-bold text-xl">CareerAI</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-text-secondary hover:text-primary transition-colors">
              登录
            </Link>
            <Link to="/register">
              <Button size="sm">免费注册</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary to-primary-700" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            让AI助你开启
            <span className="text-accent">职业新篇章</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            从职业测评到智能简历，从技能分析到AI辅导，全方位助力你的职业发展
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-accent hover:bg-accent-600 text-white">
                免费开始
                <ArrowRight size={18} />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="secondary" size="lg" className="border-white/30 text-white hover:bg-white/10">
                了解更多
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-text-primary mb-4">核心功能</h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              三大核心模块，覆盖职业发展全流程
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-8 rounded-2xl border border-gray-100 hover:border-accent/30 hover:shadow-lg transition-all"
              >
                <div className={`w-14 h-14 rounded-xl ${f.color} flex items-center justify-center mb-5`}>
                  <f.icon size={28} />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-3">{f.title}</h3>
                <p className="text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {s.label === '注册用户' && <Users size={20} className="text-accent" />}
                  {s.label === '创建简历' && <FileBarChart size={20} className="text-accent" />}
                  {s.label === '用户好评' && <Star size={20} className="text-accent" />}
                  {s.label === '合作企业' && <Users size={20} className="text-accent" />}
                  <span className="text-3xl font-bold text-primary">{s.value}</span>
                </div>
                <span className="text-text-secondary text-sm">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary to-primary-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">准备好开启你的职业之旅了吗？</h2>
          <p className="text-white/70 mb-8 max-w-lg mx-auto">
            加入数万用户，让AI成为你的职业发展伙伴
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-accent hover:bg-accent-600 text-white">
              立即注册，免费使用
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="py-8 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 text-center text-text-secondary text-sm">
          <p>© 2024 CareerAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
