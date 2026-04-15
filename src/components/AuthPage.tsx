import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Zap, Shield, BarChart3, Sparkles } from "lucide-react";
import AnimatedBackground from "./AnimatedBackground";
import TypingText from "./TypingText";
import FloatingCounter from "./FloatingCounter";

interface AuthPageProps {
  onAuth: () => void;
}

const AuthPage = ({ onAuth }: AuthPageProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuth();
  };

  const features = [
    { icon: Zap, title: "Lightning Fast", desc: "Process millions of rows instantly" },
    { icon: Shield, title: "Secure Analysis", desc: "Your data never leaves your browser" },
    { icon: BarChart3, title: "Smart Insights", desc: "AI-powered pattern recognition" },
    { icon: Sparkles, title: "Auto Clean", desc: "Intelligent data preprocessing" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      {/* Gradient orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(170 80% 50% / 0.4), transparent)", top: "-10%", right: "-10%" }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(260 70% 60% / 0.4), transparent)", bottom: "-10%", left: "-5%" }}
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Left: branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:block space-y-8"
          >
            <div>
              <motion.h1
                className="text-5xl font-display font-bold text-gradient leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                DataForge
              </motion.h1>
              <motion.p
                className="text-xl text-muted-foreground mt-4 font-body"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Next-generation automated data preprocessing & intelligence platform
              </motion.p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="glass rounded-xl p-4 cursor-default"
                >
                  <f.icon className="w-8 h-8 text-primary mb-2" />
                  <h3 className="font-display text-sm font-semibold text-foreground">{f.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: auth form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="glass-strong rounded-2xl p-8 gradient-border">
              <div className="text-center mb-8">
                <motion.div
                  className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 glow-primary"
                  style={{ background: "linear-gradient(135deg, hsl(170 80% 50%), hsl(260 70% 60%))" }}
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <BarChart3 className="w-8 h-8 text-background" />
                </motion.div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  {isLogin ? "Welcome Back" : "Join DataForge"}
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                  {isLogin ? "Sign in to continue" : "Create your account"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div
                      key="name"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        placeholder="John Doe"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-display font-semibold text-sm tracking-wider relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg, hsl(170 80% 50%), hsl(260 70% 60%))" }}
                  whileHover={{ scale: 1.02, boxShadow: "0 0 30px hsl(170 80% 50% / 0.4)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10 text-background">
                    {isLogin ? "SIGN IN" : "CREATE ACCOUNT"}
                  </span>
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <span className="text-primary font-semibold">{isLogin ? "Sign Up" : "Sign In"}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
