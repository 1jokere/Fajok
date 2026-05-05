import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface JokerAvatarProps {
  isTyping: boolean;
  isSpeaking: boolean;
}

export default function JokerAvatar({ isTyping, isSpeaking }: JokerAvatarProps) {
  const isActive = isTyping || isSpeaking;

  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96 mx-auto mb-8">
      {/* Background Chaos Glow */}
      <motion.div 
        animate={{ 
          opacity: isSpeaking ? [0.3, 0.6, 0.3] : 0.1,
          scale: isSpeaking ? [1, 1.1, 1] : 1
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute inset-0 bg-purple-900/30 blur-[100px] rounded-full"
      />

      {/* Main Avatar Container - STEADY */}
      <div className="relative z-10 w-full h-full rounded-full overflow-hidden border-4 border-green-500/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black">
        <motion.img 
          src="https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&q=80&w=1000"
          alt="Joker"
          className="w-full h-full object-cover contrast-125"
          animate={{
            // Simulated mouth movement: subtle vertical scale at the jaw
            scaleY: isSpeaking ? [1, 1.04, 0.98, 1.02, 1] : 1,
            y: isSpeaking ? [0, 1, -0.5, 1, 0] : 0,
          }}
          style={{ originY: 0.8 }}
          transition={{
            duration: 0.15,
            repeat: isSpeaking ? Infinity : 0,
            ease: "easeInOut"
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://m.media-amazon.com/images/M/MV5BMjA1MDU3OTQ4OF5BMl5BanBnXkFtZTgwNTM5NjE5OTE@._V1_.jpg';
          }}
        />
        
        {/* Subtle Light overlay on speech */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-green-500/20 to-transparent pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Static Green Ring */}
      <div className="absolute inset-x-[-10px] inset-y-[-10px] rounded-full border-2 border-green-500/20 pointer-events-none blur-[1px]" />
    </div>
  );
}
