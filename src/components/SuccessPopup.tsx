import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles, X } from "lucide-react";

interface SuccessPopupProps {
  show: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const SuccessPopup = ({ show, onClose, title, message }: SuccessPopupProps) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          className="relative glass-strong rounded-3xl p-8 max-w-md w-full text-center gradient-border"
          initial={{ scale: 0.5, rotateX: 90 }}
          animate={{ scale: 1, rotateX: 0 }}
          exit={{ scale: 0.5, rotateX: -90, opacity: 0 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>

          <motion.div
            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 glow-primary"
            style={{ background: "linear-gradient(135deg, hsl(170 80% 50%), hsl(260 70% 60%))" }}
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
          >
            <CheckCircle2 className="w-10 h-10 text-background" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="font-display text-2xl font-bold text-gradient mb-2">{title}</h3>
            <p className="text-muted-foreground">{message}</p>
          </motion.div>

          <motion.div
            className="flex justify-center gap-2 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -8, 0], rotate: [0, 180, 360] }}
                transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
              >
                <Sparkles className="w-5 h-5 text-primary" />
              </motion.div>
            ))}
          </motion.div>

          <motion.button
            onClick={onClose}
            className="mt-6 px-8 py-3 rounded-xl font-display font-semibold text-sm text-background"
            style={{ background: "linear-gradient(135deg, hsl(170 80% 50%), hsl(260 70% 60%))" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            CONTINUE
          </motion.button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default SuccessPopup;
