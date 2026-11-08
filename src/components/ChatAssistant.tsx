import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Terminal, Copy, Check, Code, RefreshCw } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface Persona {
  id: string;
  name: string;
  role: string;
  systemInstruction: string;
}

const PERSONAS: Persona[] = [
  {
    id: 'android',
    name: 'Android Kotlin Expert',
    role: 'Specialized in Jetpack Compose, Kotlin coroutines, and Android architecture.',
    systemInstruction: 'You are an expert Android and Kotlin developer working on the Dar Base44 AI Android app. Provide production-ready Kotlin code and clean Jetpack Compose layouts.'
  },
  {
    id: 'base44',
    name: 'Base44 Architect',
    role: 'Specialized in Base44 AI workflows, app scaffolding, and API integration.',
    systemInstruction: 'You are the lead Base44 AI architect. Help structure app modules, UI state management, and seamless AI features.'
  },
  {
    id: 'general',
    name: 'Gemini AI Assistant',
    role: 'General purpose AI assistant for coding, writing, and problem solving.',
    systemInstruction: 'You are a helpful AI assistant integrated into Dar Base44 AI Android platform.'
  }
];

export const ChatAssistant: React.FC = () => {
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'Welcome to **Dar Base44 AI Android**! Connected to repository `mstqymm4-svg/Dar-base44-ai-android.git`. How can I help you build or debug your Android & AI application today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          systemInstruction: selectedPersona.systemInstruction
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessages([...newMessages, { role: 'model', content: data.response }]);
      } else {
        setMessages([...newMessages, { role: 'model', content: `Error: ${data.error || 'Failed to get AI response'}` }]);
      }
    } catch (err: any) {
      setMessages([...newMessages, { role: 'model', content: `Network error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-slate-950 text-slate-100">
      {/* Header bar for persona selection */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Bot className="w-5 h-5 text-emerald-400" />
          <div>
            <span className="text-xs text-slate-400 block">Active Persona</span>
            <select
              value={selectedPersona.id}
              onChange={(e) => {
                const found = PERSONAS.find(p => p.id === e.target.value);
                if (found) setSelectedPersona(found);
              }}
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500"
            >
              {PERSONAS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          {selectedPersona.role}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div key={index} className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isUser ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-emerald-400 border border-slate-700'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                isUser
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-xl'
              }`}>
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                <div className="mt-2 flex items-center justify-end space-x-2 text-[10px] text-slate-400 border-t border-slate-800/40 pt-1.5">
                  <span>{isUser ? 'You' : selectedPersona.name}</span>
                  <button
                    onClick={() => copyText(msg.content, index)}
                    className="hover:text-white flex items-center space-x-1 bg-slate-800/50 px-2 py-0.5 rounded transition"
                  >
                    {copiedIndex === index ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIndex === index ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-400 flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Dar Base44 AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <form onSubmit={handleSend} className="flex items-center space-x-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Android Jetpack Compose, Kotlin, or Base44 features..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition shadow-inner"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-medium text-sm flex items-center space-x-2 transition shadow-lg shadow-emerald-600/20"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
