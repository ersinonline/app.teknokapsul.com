import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EnhancedAIAssistant } from '../ai/EnhancedAIAssistant';

export const ChatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleChatClick = () => {
    // Mobil cihazlarda AI asistan sayfasına yönlendir
    if (window.innerWidth < 1024) {
      navigate('/ai-assistant');
    } else {
      // Masaüstünde chat modal'ını aç
      setIsOpen(!isOpen);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={handleChatClick}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        style={{ backgroundColor: '#ffb700' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6a500'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffb700'}
        aria-label="AI Sohbet"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:inset-auto lg:bottom-20 lg:right-6 lg:w-96 lg:h-[600px]">
          {/* Backdrop for mobile */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 lg:hidden" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Chat Container */}
          <div className="relative bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl h-full lg:h-[600px] flex flex-col mt-16 lg:mt-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b text-white rounded-t-2xl lg:rounded-t-2xl" style={{ backgroundColor: '#ffb700' }}>
              <h3 className="font-semibold">AI Asistan</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full transition-colors"
                style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              <EnhancedAIAssistant />
            </div>
          </div>
        </div>
      )}
    </>
  );
};