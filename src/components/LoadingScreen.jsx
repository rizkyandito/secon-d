import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="text-center">
        {/* Animated Logo/Icon */}
        <motion.div
          className="relative mb-8"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-24 h-24 mx-auto relative">
            {/* Outer spinning ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand border-r-brand2"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
              }}
            />

            {/* Inner spinning ring */}
            <motion.div
              className="absolute inset-2 rounded-full border-4 border-transparent border-b-purple-600 border-l-brand"
              animate={{ rotate: -360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
            />

            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="text-5xl"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                🏪
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Animated Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="text-2xl font-bold bg-gradient-to-r from-brand via-brand2 to-purple-600 bg-clip-text text-transparent">
            Memuat data...
          </h3>

          {/* Animated dots */}
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-gradient-to-r from-brand to-brand2 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
            Sabar ya.. server gratis soalnya 😊
          </p>
        </motion.div>

        {/* Progress bar animation */}
        <motion.div
          className="mt-8 w-64 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mx-auto"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-brand via-brand2 to-purple-600"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
