import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error';

interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

let toastId = 0;
let listeners: ((msg: ToastMessage) => void)[] = [];

export const toast = {
  success: (text: string) => {
    const msg: ToastMessage = { id: ++toastId, text, type: 'success' };
    listeners.forEach((fn) => fn(msg));
  },
  error: (text: string) => {
    const msg: ToastMessage = { id: ++toastId, text, type: 'error' };
    listeners.forEach((fn) => fn(msg));
  },
};

const ToastContainer: React.FC = () => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (msg: ToastMessage) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      }, 3000);
    };
    listeners.push(handler);
    return () => {
      listeners = listeners.filter((fn) => fn !== handler);
    };
  }, []);

  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg animate-[fadeInUp_0.3s_ease] ${
            msg.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
