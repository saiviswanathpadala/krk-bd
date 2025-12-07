import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const AIChatBubble: React.FC = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);

  // Only show for customers and hide on AI chat page
  if (user?.role?.toLowerCase() !== 'customer' || !isVisible || location.pathname === '/ai-chat') return null;

  const handleChatClick = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1 }
      });
      
      const conversations = response.data.conversations || [];
      if (conversations.length > 0) {
        navigate(`/ai-chat?cid=${conversations[0].id}`);
      } else {
        navigate('/ai-chat');
      }
    } catch (error) {
      navigate('/ai-chat');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2">
      <button
        onClick={handleChatClick}
        className="group relative w-14 h-14 sm:w-16 sm:h-16 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center"
        aria-label="Open AI Chat"
      >
        <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </button>
    </div>
  );
};
