import { create } from 'zustand';
import type { ChatMessage } from '@/shared/types';
import { api } from '@/utils/api';

interface ChatState {
  messages: ChatMessage[];
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  sessionId: null,
  isLoading: false,
  error: null,

  sendMessage: async (content: string) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, userMessage], isLoading: true }));
    try {
      const { sessionId } = get();
      const res = await api.post<{ reply: string; sessionId: string }>('/ai/chat', {
        message: content,
        sessionId,
      });
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
      };
      set((state) => ({
        messages: [...state.messages, assistantMessage],
        sessionId: res.sessionId,
        isLoading: false,
      }));
    } catch (err: unknown) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: '抱歉，我暂时无法回复，请稍后再试。',
        timestamp: new Date().toISOString(),
      };
      set((state) => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
      }));
    }
  },

  clearChat: () => set({ messages: [], sessionId: null }),
}));
