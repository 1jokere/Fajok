import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Mic, MicOff, Volume2, VolumeX, Ghost, Laugh, Square, Settings, X, SlidersHorizontal } from 'lucide-react';
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
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('joker_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch (e) {
        return [];
      }
    }
    return [{ 
      id: 'welcome', 
      role: 'model', 
      text: 'Hé hé hé... Alors, prêt pour une petite dose de chaos aujourd\'hui ? Dis-moi ce qui te tracasse, ou mieux encore, laisse-moi te donner une raison de sourire... de force !', 
      timestamp: new Date() 
    }];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Audio settings
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(() => localStorage.getItem('joker_voice'));
  const [pitch, setPitch] = useState(() => parseFloat(localStorage.getItem('joker_pitch') || '0.8'));
  const [rate, setRate] = useState(() => parseFloat(localStorage.getItem('joker_rate') || '1'));
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem('joker_messages', JSON.stringify(messages));
  }, [messages]);

  // Save settings to localStorage
  useEffect(() => {
    if (selectedVoice) localStorage.setItem('joker_voice', selectedVoice);
    localStorage.setItem('joker_pitch', pitch.toString());
    localStorage.setItem('joker_rate', rate.toString());
  }, [selectedVoice, pitch, rate]);
  
  // Speech Recognition setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Nettoyage au démarrage pour éviter les blocages
      window.speechSynthesis.cancel();
      
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        // Filtrer les voix françaises en priorité
        const filteredVoices = availableVoices.sort((a, b) => {
          if (a.lang.startsWith('fr') && !b.lang.startsWith('fr')) return -1;
          if (!a.lang.startsWith('fr') && b.lang.startsWith('fr')) return 1;
          return 0;
        });
        setVoices(filteredVoices);
        
        // Sélectionner par défaut la première voix FR si rien n'est choisi
        if (!selectedVoice) {
          const fr = filteredVoices.find(v => v.lang.startsWith('fr'));
          if (fr) setSelectedVoice(fr.name);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;

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
    
    // Arrêter toute parole en cours proprement
    stopSpeech();
    
    // Nettoyer les astérisques pour éviter qu'ils ne soient prononcés
    const cleanText = text.replace(/\*/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance;
    
    if (selectedVoice) {
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
    }
    
    utterance.pitch = pitch;
    utterance.rate = rate;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };
    
    // Hack pour certains navigateurs qui mettent la synthèse en pause
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    if (utteranceRef.current) {
      utteranceRef.current.onstart = null;
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current = null;
    }
    setIsSpeaking(false);
    setIsTyping(false); // Permet d'arrêter aussi l'état "réflexion"
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
      const history: ChatMessage[] = messages.slice(-20).map(m => ({
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
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-purple-400"
            title="Réglages"
          >
            <Settings size={20} />
          </button>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-purple-400"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(255,0,0,0.8)] self-center"></div>
        </div>
      </header>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-zinc-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="text-green-400" size={20} />
                  <h2 className="text-xl font-display text-green-400 uppercase tracking-widest">Réglages du Joker</h2>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if (confirm('Voulez-vous vraiment effacer la mémoire du Joker ?')) {
                        localStorage.removeItem('joker_messages');
                        setMessages([{ 
                          id: 'welcome-' + Date.now(),
                          role: 'model', 
                          text: 'Mémoire effacée... Comme une ardoise propre prête à être ensanglantée !',
                          timestamp: new Date()
                        }]);
                      }
                    }}
                    className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 text-[10px] font-mono rounded-xl border border-red-500/20 transition-all uppercase tracking-tighter"
                    title="Effacer l'historique"
                  >
                    Effacer
                  </button>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="p-1 hover:bg-white/10 rounded-full text-purple-400"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Voice Selection */}
                <div>
                  <label className="block text-xs font-mono text-purple-400 mb-2 uppercase tracking-tighter">Voix Disponible</label>
                  <select 
                    value={selectedVoice || ''}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full bg-black border border-purple-500/20 rounded-xl px-4 py-2 text-white focus:border-green-500/50 outline-none"
                  >
                    {voices.map(voice => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pitch Slider */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-mono text-purple-400 uppercase tracking-tighter">Tonalité (Pitch)</label>
                    <span className="text-xs font-mono text-green-400">{pitch.toFixed(1)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="2" 
                    step="0.1" 
                    value={pitch}
                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                    className="w-full accent-green-500 h-1 bg-purple-900/30 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-1 text-[10px] text-purple-400/50 font-mono">
                    <span>GRAVE</span>
                    <span>AIGU</span>
                  </div>
                </div>

                {/* Rate Slider */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-mono text-purple-400 uppercase tracking-tighter">Vitesse</label>
                    <span className="text-xs font-mono text-green-400">{rate.toFixed(1)}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2" 
                    step="0.1" 
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value))}
                    className="w-full accent-green-500 h-1 bg-purple-900/30 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => {
                    handleSpeech("Hé hé hé ! Est-ce que cette voix te plaît davantage, petit farceur ?");
                  }}
                  className="w-full py-3 bg-purple-900/40 hover:bg-purple-700/50 border border-purple-500/30 rounded-xl text-purple-300 font-mono text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Volume2 size={18} />
                  TESTER LA VOIX
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <div className={`max-w-[80%] rounded-2xl p-4 relative group ${
                message.role === 'user' 
                  ? 'bg-purple-900/40 border border-purple-500/30 text-white rounded-br-none' 
                  : 'bg-green-900/20 border border-green-500/20 text-green-50 text-base leading-relaxed rounded-bl-none shadow-[0_0_20px_rgba(0,0,0,0.2)]'
              }`}>
                <div className="markdown-body">
                  <Markdown>{message.text}</Markdown>
                </div>
                <div className={`mt-2 flex items-center gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-between'}`}>
                  {message.role === 'model' && (
                    <button
                      onClick={() => handleSpeech(message.text)}
                      className="flex items-center gap-1.5 p-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-green-400 transition-all active:scale-95 z-20"
                      title="Réécouter"
                    >
                      <Volume2 size={14} />
                      <span className="text-[10px] font-mono leading-none tracking-wider">RÉPÉTER</span>
                    </button>
                  )}
                  <div className={`text-[10px] font-mono opacity-40 uppercase ${message.role === 'user' ? 'text-right' : ''}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
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
          <div className="relative group">
            <AnimatePresence>
              {(isSpeaking || isTyping) && (
                <motion.button
                  initial={{ opacity: 0, y: 0, x: '-50%' }}
                  animate={{ opacity: 1, y: -70, x: '-50%' }}
                  exit={{ opacity: 0, y: 0, x: '-50%' }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    stopSpeech();
                  }}
                  className="absolute left-1/2 p-4 bg-red-600 text-white rounded-full shadow-[0_0_30px_rgba(255,0,0,0.6)] z-[60] border-2 border-white/20 flex items-center justify-center"
                  title="LA FERME JOKER !"
                >
                  <Square size={20} fill="currentColor" />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-600 text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap shadow-lg">STOP !</span>
                </motion.button>
              )}
            </AnimatePresence>
            
            <button
              onClick={toggleListening}
              className={`p-4 rounded-xl transition-all relative z-10 ${
                isListening 
                  ? 'bg-red-600 shadow-[0_0_20px_rgba(255,0,0,0.5)] scale-110' 
                  : 'bg-purple-900/40 hover:bg-purple-700/50 text-purple-400'
              }`}
            >
              {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
          </div>
          
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
