import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2 } from "lucide-react";

interface ChartZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const ChartZoomModal = ({ isOpen, onClose, title, children }: ChartZoomModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-5xl max-h-[90vh] glass-strong rounded-3xl border border-border/50 overflow-hidden"
            initial={{ scale: 0.5, opacity: 0, rotateX: 15 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotateX: -15 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/30">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Maximize2 className="w-4 h-4 text-primary-foreground" />
                </motion.div>
                <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
              </div>
              <motion.button
                onClick={onClose}
                className="w-10 h-10 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Chart area */}
            <div className="p-8" style={{ minHeight: "500px" }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const ZoomableChart = ({
  title,
  children,
  fullChildren,
}: {
  title: string;
  children: React.ReactNode;
  fullChildren: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className="relative cursor-pointer group"
        onClick={() => setIsOpen(true)}
      >
        {children}
        {/* Zoom overlay hint */}
        <motion.div
          className="absolute top-4 right-4 w-8 h-8 rounded-lg glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
          whileHover={{ scale: 1.2 }}
        >
          <Maximize2 size={14} className="text-primary" />
        </motion.div>
      </div>

      <ChartZoomModal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title}>
        {fullChildren}
      </ChartZoomModal>
    </>
  );
};

import { useState } from "react";

export default ChartZoomModal;
