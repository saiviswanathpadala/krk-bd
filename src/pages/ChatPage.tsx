import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Loader2, AlertCircle, MessageSquare, User, CheckCheck, Check } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { userAPI } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Message {
  id: string;
  senderId: number;
  recipientId: number;
  content: string;
  status: string;
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
}

interface Conversation {
  id: string;
  participantId: number;
  participantName: string;
  participantRole: string;
  participantProfileImg?: string;
}

const personChatAPI = {
  createOrGetConversation: (token: string, participantId: number) =>
    axios.post(`${API_BASE_URL}/chat/person/conversations`, { participantId }, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  getMessages: (token: string, conversationId: string, params?: { limit?: number; cursor?: string }) =>
    axios.get(`${API_BASE_URL}/chat/person/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    }),
  sendMessage: (token: string, conversationId: string, data: { content: string }) =>
    axios.post(`${API_BASE_URL}/chat/person/conversations/${conversationId}/messages`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),
};

const MessageSkeleton = ({ isMe }: { isMe: boolean }) => (
  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
    <div className={`max-w-[70%] ${isMe ? 'bg-primary/20' : 'bg-muted'} rounded-2xl p-3 animate-pulse`}>
      <Skeleton className="h-4 w-32 mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);

export const ChatPage: React.FC = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [participantInfo, setParticipantInfo] = useState<{
    id: number;
    name: string;
    role: string;
    profileImg?: string;
  } | null>(null);

  // Initialize conversation
  useEffect(() => {
    const initConversation = async () => {
      if (!token) return;
      
      try {
        // Check if participant info passed from navigation state
        const state = location.state as any;
        
        if (state?.participantId) {
          // Direct chat with specific participant (from detail pages)
          const response = await personChatAPI.createOrGetConversation(token, state.participantId);
          const conversation = response.data.conversation;
          
          setConversationId(conversation.id);
          setParticipantInfo({
            id: state.participantId,
            name: state.participantName || 'User',
            role: state.participantRole || 'user',
            profileImg: state.participantProfileImg,
          });
        } else {
          // Default: chat with admin (for customers/agents/employees)
          const adminsResponse = await userAPI.getAdmins(token);
          const admins = adminsResponse.data.admins;
          
          if (!admins || admins.length === 0) {
            toast.error('No admin available for chat');
            navigate(-1);
            return;
          }
          
          const admin = admins[0];
          const response = await personChatAPI.createOrGetConversation(token, admin.id);
          const conversation = response.data.conversation;
          
          setConversationId(conversation.id);
          setParticipantInfo({
            id: admin.id,
            name: admin.name || 'Admin',
            role: 'admin',
            profileImg: admin.profileImgUrl,
          });
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to initialize chat');
        navigate(-1);
      }
    };

    initConversation();
  }, [token, navigate, location.state]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch } = useInfiniteQuery({
    queryKey: ['person-chat-messages', conversationId],
    queryFn: ({ pageParam }) => personChatAPI.getMessages(token!, conversationId!, { limit: 30, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.data.nextCursor,
    enabled: !!conversationId && !!token,
    staleTime: 0,
    gcTime: 300000,
    retry: 2,
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
  });

  const messages = data?.pages.flatMap(page => page.data.messages).reverse() || [];

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => personChatAPI.sendMessage(token!, conversationId!, { content }),
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ['person-chat-messages', conversationId] });
      const previousData = queryClient.getQueryData(['person-chat-messages', conversationId]);
      
      queryClient.setQueryData(['person-chat-messages', conversationId], (old: any) => {
        if (!old?.pages) return old;
        
        const newMessage = {
          id: `temp-${Date.now()}`,
          senderId: user!.id,
          recipientId: participantInfo!.id,
          content,
          status: 'sent',
          createdAt: new Date().toISOString(),
        };
        
        const lastPageIndex = old.pages.length - 1;
        const lastPage = old.pages[lastPageIndex];
        
        return {
          ...old,
          pages: [
            ...old.pages.slice(0, lastPageIndex),
            {
              ...lastPage,
              data: {
                ...lastPage.data,
                messages: [newMessage, ...lastPage.data.messages],
              },
            },
          ],
        };
      });
      
      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person-chat-messages', conversationId] });
      refetch();
    },
    onError: (err, content, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['person-chat-messages', conversationId], context.previousData);
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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Infinite scroll handler
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
        const prevHeight = container.scrollHeight;
        fetchNextPage().then(() => {
          requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight - prevHeight;
          });
        });
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!conversationId || !participantInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
          {participantInfo.profileImg ? (
            <img
              src={participantInfo.profileImg}
              alt={participantInfo.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
          )}
          <div>
            <h2 className="font-semibold text-foreground">{participantInfo.name}</h2>
            <p className="text-xs text-muted-foreground capitalize">{participantInfo.role}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <MessageSkeleton key={i} isMe={i % 2 === 0} />
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
              const isMe = message.senderId === user?.id;
              return (
                <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'} rounded-2xl p-3`}>
                    <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <span className={`text-xs ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {formatTime(message.createdAt)}
                      </span>
                      {isMe && (
                        message.deliveredAt ? (
                          <CheckCheck className="w-3 h-3 text-blue-400" />
                        ) : (
                          <Check className="w-3 h-3 text-primary-foreground/70" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
            maxLength={5000}
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
