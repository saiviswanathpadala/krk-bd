import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Loader2, AlertCircle, MessageSquare, Plus, Bot } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import axios from 'axios';
import logoImage from '@/assets/logo.png';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'ai';
  content: string;
  status: string;
  createdAt: string;
}

const chatAPI = {
  createConversation: (token: string, data?: { title?: string; context?: any }) =>
    axios.post(`${API_BASE_URL}/conversations`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  getMessages: (token: string, conversationId: string, params?: { limit?: number; offset?: number }) =>
    axios.get(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    }),
  sendMessage: (token: string, conversationId: string, data: { content: string; meta?: any }) =>
    axios.post(`${API_BASE_URL}/conversations/${conversationId}/messages`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),
};

const MessageSkeleton = ({ isUser }: { isUser: boolean }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
    <div className={`max-w-[70%] ${isUser ? 'bg-primary/20' : 'bg-muted'} rounded-2xl p-3 animate-pulse`}>
      <Skeleton className="h-4 w-32 mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);

export const AIChatPage: React.FC = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(searchParams.get('cid'));
  const [isTyping, setIsTyping] = useState(false);
  const previousMessageCountRef = useRef(0);

  // Create conversation if none exists
  useEffect(() => {
    const initConversation = async () => {
      if (!token || conversationId) return;
      
      try {
        const response = await chatAPI.createConversation(token);
        const newConvId = response.data.id;
        setConversationId(newConvId);
        setSearchParams({ cid: newConvId });
      } catch (error: any) {
        toast.error('Failed to initialize chat');
      }
    };

    initConversation();
  }, [token, conversationId, setSearchParams]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-chat-messages', conversationId],
    queryFn: () => chatAPI.getMessages(token!, conversationId!, { limit: 50, offset: 0 }),
    enabled: !!conversationId && !!token,
    staleTime: 0,
    gcTime: 300000,
    retry: 2,
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
  });

  const messages: Message[] = data?.data?.messages || [];

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => chatAPI.sendMessage(token!, conversationId!, { content }),
    onMutate: async (content) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['ai-chat-messages', conversationId] });
      
      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(['ai-chat-messages', conversationId]);
      
      // Optimistically update with new message
      queryClient.setQueryData(['ai-chat-messages', conversationId], (old: any) => {
        const newMessage = {
          id: `temp-${Date.now()}`,
          conversationId: conversationId!,
          sender: 'user',
          content,
          status: 'sending',
          createdAt: new Date().toISOString(),
        };
        return {
          ...old,
          data: {
            ...old?.data,
            messages: [...(old?.data?.messages || []), newMessage],
          },
        };
      });
      
      return { previousMessages };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-chat-messages', conversationId] });
      refetch();
    },
    onError: (err, content, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['ai-chat-messages', conversationId], context.previousMessages);
      }
      toast.error('Failed to send message');
    },
    onSettled: () => {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    },
  });

  const handleSend = () => {
    if (!messageText.trim() || sendMessageMutation.isPending) return;
    const content = messageText.trim();
    setMessageText('');
    sendMessageMutation.mutate(content);
  };

  const handleNewChat = async () => {
    try {
      const response = await chatAPI.createConversation(token!);
      const newConvId = response.data.id;
      setConversationId(newConvId);
      setSearchParams({ cid: newConvId });
      queryClient.setQueryData(['ai-chat-messages', newConvId], { data: { messages: [] } });
      toast.success('New conversation started');
    } catch (error) {
      toast.error('Failed to create new chat');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Auto-scroll and typing indicator
  useEffect(() => {
    const currentCount = messages.length;
    if (currentCount > previousMessageCountRef.current) {
      const lastMessage = messages[currentCount - 1];
      if (lastMessage?.sender === 'user') {
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 5000);
        }, 1000);
      } else if (lastMessage?.sender === 'ai') {
        setIsTyping(false);
      }
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
    previousMessageCountRef.current = currentCount;
  }, [messages.length]);

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            <img src={logoImage} alt="AI" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">Always here to help</p>
          </div>
        </div>
        {/* <button
          onClick={handleNewChat}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="New chat"
        >
          <Plus className="w-5 h-5 text-primary" />
        </button> */}
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <MessageSkeleton key={i} isUser={i % 2 === 0} />
            ))}
          </>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle className="w-16 h-16 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Messages</h3>
            <p className="text-muted-foreground text-center mb-4">
              Unable to fetch messages. Please check your connection.
            </p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <>
            {messages.map((message: Message) => {
              const isUser = message.sender === 'user';
              return (
                <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mr-2 flex-shrink-0">
                      <img src={logoImage} alt="AI" className="w-10 h-10 object-contain" />
                    </div>
                  )}
                  <div className={`max-w-[70%] ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'} rounded-2xl p-3`}>
                    <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <span className={`text-xs ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex justify-start">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mr-2 flex-shrink-0">
                  <img src={logoImage} alt="AI" className="w-10 h-10 object-contain" />
                </div>
                <div className="bg-muted rounded-2xl p-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer */}
      <div className="bg-card border-t border-border p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            maxLength={1000}
            className="flex-1 min-h-[44px] max-h-32 px-4 py-2 bg-background border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!messageText.trim()}
            className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
