import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface FloatingCounterProps {
  end: number;
  suffix?: string;
  label: string;
  duration?: number;
  delay?: number;
}

const FloatingCounter = ({ end, suffix = "", label, duration = 2, delay = 0 }: FloatingCounterProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0;
      const step = end / (duration * 60);
      const interval = setInterval(() => {
        start += step;
        if (start >= end) { setCount(end); clearInterval(interval); }
        else setCount(Math.floor(start));
      }, 1000 / 60);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [end, duration, delay]);

  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <motion.div
        className="font-display text-2xl font-bold text-gradient"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, delay }}
      >
        {count.toLocaleString()}{suffix}
      </motion.div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </motion.div>
  );
};

export default FloatingCounter;
