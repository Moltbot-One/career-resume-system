import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary to-primary-700 flex flex-col items-center justify-center p-4">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <Bot className="text-accent" size={32} />
        <span className="text-white text-2xl font-bold">CareerAI</span>
      </Link>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <Outlet />
      </div>
    </div>
  );
}
