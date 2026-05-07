import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { agora } from '@/lib/time-utils';

export function DigitalClock() {
  const [horaAtual, setHoraAtual] = useState(agora());

  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(agora()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      className="text-6xl font-bold text-slate-800 dark:text-white tracking-tight tabular-nums" 
      key={horaAtual} 
      initial={{ scale: 0.98, opacity: 0.8 }} 
      animate={{ scale: 1, opacity: 1 }} 
      transition={{ duration: 0.2 }}
    >
      {horaAtual}
    </motion.div>
  );
}
