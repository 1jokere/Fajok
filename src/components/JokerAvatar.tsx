import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface JokerAvatarProps {
  isTyping: boolean;
  isSpeaking: boolean;
}

export default function JokerAvatar({ isTyping, isSpeaking }: JokerAvatarProps) {
  const avatarUrl = "https://i.ibb.co/SDb3KhJS/file-00000000bc08720c8e01d6949bca16d4.png";

  return (
    <div className="relative w-48 h-48 md:w-56 md:h-56 mx-auto mb-8 flex items-center justify-center">
      
      {/* Background Glow Ring */}
      <motion.div
        animate={{
          scale: isSpeaking ? [1, 1.15, 1] : isTyping ? [1, 1.05, 1] : [1, 1.02, 1],
          opacity: isSpeaking ? [0.6, 0.9, 0.6] : 0.4,
        }}
        transition={{
          duration: isSpeaking ? 1.2 : 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute inset-0 rounded-full blur-2xl transition-colors duration-500 pointer-events-none ${
          isSpeaking
            ? "bg-green-500/30"
            : isTyping
            ? "bg-purple-500/25"
            : "bg-purple-600/10"
        }`}
      />

      {/* Speaking Concentric Waves */}
      <AnimatePresence>
        {isSpeaking && (
          <>
            <motion.div
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border border-green-500/40 pointer-events-none"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0.5 }}
              animate={{ scale: 1.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
              className="absolute inset-0 rounded-full border-2 border-purple-500/35 pointer-events-none"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0.3 }}
              animate={{ scale: 2.1, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.1, repeat: Infinity, ease: "easeOut", delay: 1 }}
              className="absolute inset-0 rounded-full border border-green-500/20 pointer-events-none"
            />
          </>
        )}
      </AnimatePresence>

      {/* Main Floating Container */}
      <motion.div
        animate={{
          y: isSpeaking ? [-4, 4, -4] : [-6, 6, -6],
          rotate: isSpeaking ? [-1.5, 1.5, -1.5] : [0, 0, 0]
        }}
        transition={{
          duration: isSpeaking ? 2 : 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative z-10 w-36 h-36 md:w-44 md:h-44 rounded-full p-1 bg-zinc-950/80 backdrop-blur-sm shadow-[0_0_35px_rgba(0,0,0,0.8)] border border-white/5"
      >
        {/* Glowing border outline */}
        <motion.div
          animate={{
            borderColor: isSpeaking 
              ? "rgba(34, 197, 94, 0.6)" 
              : isTyping 
              ? "rgba(168, 85, 247, 0.6)" 
              : "rgba(168, 85, 247, 0.15)"
          }}
          className="absolute inset-0 rounded-full border-2 transition-colors duration-500 pointer-events-none z-20"
        />

        {/* Circular Avatar Wrapper */}
        <div className="w-full h-full rounded-full overflow-hidden relative bg-zinc-900 border border-zinc-800">
          <img
            src={avatarUrl}
            alt="Joker AI Avatar"
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover transition-all duration-500 select-none ${
              isSpeaking 
                ? "scale-[1.06] brightness-110 contrast-105" 
                : isTyping 
                ? "scale-[1.03] animate-pulse" 
                : "scale-100 opacity-90"
            }`}
          />
          
          {/* Subtle noise / scanline overlay to keep it in theme */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-purple-500/2 to-transparent mix-blend-overlay" />
        </div>

        {/* Dynamic Speech Active Accent Glow */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full pointer-events-none z-10 shadow-[inset_0_0_20px_rgba(34,197,94,0.3)]"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Speech wave dots overlay on the side */}
      <AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-1 right-2 z-30 bg-purple-950/90 border border-purple-500/30 rounded-full px-3 py-1.5 flex items-center gap-1 shadow-lg"
          >
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
