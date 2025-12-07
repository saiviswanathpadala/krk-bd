import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Don't scroll to top for chat pages
    const isChatPage = pathname === '/chat' || 
                       pathname === '/ai-chat' || 
                       pathname.startsWith('/chat/');
    
    if (isChatPage) {
      return;
    }

    // Scroll to top for all other pages
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' as ScrollBehavior,
    });
  }, [pathname]);

  return null;
};

