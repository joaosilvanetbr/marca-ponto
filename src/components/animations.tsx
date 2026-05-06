import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

export function TabSlide({ children, activeTab, direction = 'right' }: { children: ReactNode; activeTab: string; direction?: 'left' | 'right' }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: direction === 'right' ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction === 'right' ? -20 : 20 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
