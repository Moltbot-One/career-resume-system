import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await register({ username, email, password });
      navigate('/dashboard');
    } catch {}
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-text-primary">创建账号</h2>
        <p className="text-text-secondary mt-1">开始你的职业发展之旅</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      <div className="relative">
        <User className="absolute left-3 top-9 text-gray-400" size={18} />
        <Input
          label="用户名"
          placeholder="请输入用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="pl-10"
          required
        />
      </div>

      <div className="relative">
        <Mail className="absolute left-3 top-9 text-gray-400" size={18} />
        <Input
          label="邮箱"
          type="email"
          placeholder="请输入邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-10"
          required
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-9 text-gray-400" size={18} />
        <Input
          label="密码"
          type="password"
          placeholder="请输入密码（至少6位）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="pl-10"
          required
          minLength={6}
        />
      </div>

      <Button type="submit" loading={isLoading} className="w-full">
        注册
      </Button>

      <p className="text-center text-sm text-text-secondary">
        已有账号？{' '}
        <Link to="/login" className="text-accent hover:text-accent-600 font-medium">
          立即登录
        </Link>
      </p>
    </form>
  );
}
