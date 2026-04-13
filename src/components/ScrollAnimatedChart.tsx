import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface ScrollAnimatedChartProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const ScrollAnimatedChart = ({ children, className = "", delay = 0 }: ScrollAnimatedChartProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [key, setKey] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setKey((k) => k + 1);
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      <motion.div
        key={key}
        initial={{ opacity: 0, scale: 0.8, y: 40 }}
        animate={isVisible ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 40 }}
        transition={{ duration: 0.7, delay, type: "spring", damping: 15 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default ScrollAnimatedChart;
