import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Mic, MicOff, Volume2, VolumeX, Ghost, Laugh, Square } from 'lucide-react';
import Markdown from 'react-markdown';
import { chatWithJoker, ChatMessage } from '../services/geminiService';
import JokerAvatar from './JokerAvatar';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Speech Recognition setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'fr-FR';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          handleSend(transcript);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const handleSpeech = (text: string) => {
    if (isMuted) return;
    window.speechSynthesis.cancel();
    
    // Nettoyer les astérisques pour éviter qu'ils ne soient prononcés
    const cleanText = text.replace(/\*/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fr-FR';
    utterance.pitch = 0.8;
    utterance.rate = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Prepare history for Gemini
      const history: ChatMessage[] = messages.slice(-10).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await chatWithJoker(history, text);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      handleSpeech(response);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Même mon génie a ses limites... ou alors c'est ton réseau qui flanche ! Ha ha ha !",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto joker-bg shadow-2xl border-x border-purple-900/30">
      {/* Header */}
      <header className="p-6 border-b border-purple-900/50 flex items-center justify-between bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-700 rounded-full flex items-center justify-center border-2 border-green-400 shadow-[0_0_15px_rgba(0,255,0,0.3)]">
            <Ghost className="text-green-400" size={28} />
          </div>
          <div>
            <h1 className="font-display text-2xl tracking-widest text-green-400">JOKER AI</h1>
            <p className="text-xs font-mono text-purple-400 uppercase tracking-tighter">Propulsé par Gemini & Chaos</p>
          </div>
        </div>
        <div className="flex gap-4">
          <AnimatePresence>
            {isSpeaking && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={stopSpeech}
                className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-full transition-colors text-red-500 border border-red-500/30 flex items-center gap-2 group"
                title="Arrêter de parler"
              >
                <Square size={20} fill="currentColor" />
                <span className="text-xs font-mono hidden group-hover:inline">STOP</span>
              </motion.button>
            )}
          </AnimatePresence>
          
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-purple-400"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(255,0,0,0.8)] self-center"></div>
        </div>
      </header>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        <JokerAvatar isTyping={isTyping} isSpeaking={isSpeaking} />

        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <Laugh size={64} className="text-purple-600 mb-4 animate-bounce" />
            <p className="font-display text-xl uppercase tracking-widest">Le jeu commence...</p>
            <p className="font-mono text-sm">Dis quelque chose, si tu l'oses.</p>
          </div>
        )}
        
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                message.role === 'user' 
                  ? 'bg-purple-900/40 border border-purple-500/30 text-white rounded-br-none' 
                  : 'bg-green-900/20 border border-green-500/20 text-green-50 text-base leading-relaxed rounded-bl-none shadow-[0_0_20px_rgba(0,0,0,0.2)]'
              }`}>
                <div className="markdown-body">
                  <Markdown>{message.text}</Markdown>
                </div>
                <div className={`mt-2 text-[10px] font-mono opacity-40 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-green-900/20 border border-green-500/20 p-4 rounded-2xl rounded-bl-none flex gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <footer className="p-6 bg-black/60 backdrop-blur-xl border-t border-purple-900/50">
        <div className="flex gap-4 items-end">
          <button
            onClick={toggleListening}
            className={`p-4 rounded-xl transition-all ${
              isListening 
                ? 'bg-red-600 shadow-[0_0_20px_rgba(255,0,0,0.5)] scale-110' 
                : 'bg-purple-900/40 hover:bg-purple-700/50 text-purple-400'
            }`}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Écris ton défi ici..."
              className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-purple-400/50 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all resize-none min-h-[50px] max-h-[150px] font-sans"
              rows={1}
            />
          </div>

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="p-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-black transition-all shadow-[0_4px_15px_rgba(0,255,0,0.3)] hover:shadow-[0_4px_25px_rgba(0,255,0,0.5)] active:scale-95"
          >
            <Send size={24} />
          </button>
        </div>
        <p className="mt-4 text-center text-[10px] font-mono text-purple-500/50 uppercase tracking-[0.2em]">
          Une blague par jour éloigne la santé mentale pour toujours.
        </p>
      </footer>
    </div>
  );
}
