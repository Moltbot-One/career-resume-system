import { useState, useRef, useEffect } from 'react';
import { Send, FileText, MessageCircle, Compass, Bot, User } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { ChatMessage } from '@/shared/types';

const quickQuestions = [
  { icon: FileText, label: '优化简历', prompt: '请帮我优化简历，让内容更有吸引力' },
  { icon: MessageCircle, label: '面试准备', prompt: '我要准备面试，请给我一些常见面试题和回答建议' },
  { icon: Compass, label: '职业咨询', prompt: '我想了解目前的职业发展方向，请给我一些建议' },
];

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-accent text-white' : 'bg-primary text-white'
      }`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className={`max-w-[70%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-white rounded-tr-md'
            : 'bg-white border border-gray-100 text-text-primary rounded-tl-md'
        }`}>
          {message.content}
        </div>
        <p className="text-xs text-text-secondary mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
        <Bot size={16} />
      </div>
      <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-md">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const { messages, isLoading, sendMessage } = useChatStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput('');
    await sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickQuestion = (prompt: string) => {
    setInput(prompt);
    sendMessage(prompt);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex-shrink-0">
        <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Bot size={22} className="text-primary" />
          AI 职业助手
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">随时为你提供职业建议和帮助</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <Bot size={32} className="text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">你好，我是 CareerAI 助手</h2>
              <p className="text-text-secondary mb-8">我可以帮你优化简历、准备面试、规划职业发展</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {quickQuestions.map((q) => (
                  <Card
                    key={q.label}
                    hover
                    className="p-4 text-center"
                    onClick={() => handleQuickQuestion(q.prompt)}
                  >
                    <q.icon size={24} className="text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium text-text-primary">{q.label}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-gray-100 px-6 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          {messages.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {quickQuestions.map((q) => (
                <button
                  key={q.label}
                  onClick={() => handleQuickQuestion(q.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-primary-50 text-text-secondary hover:text-primary text-xs rounded-full whitespace-nowrap transition-colors flex-shrink-0"
                >
                  <q.icon size={12} />
                  {q.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题..."
              rows={1}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="rounded-xl px-4"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
