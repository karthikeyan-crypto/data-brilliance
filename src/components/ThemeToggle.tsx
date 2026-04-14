import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Palette } from "lucide-react";

const THEMES = [
  { id: "dark", label: "Night", icon: Moon },
  { id: "light", label: "Day", icon: Sun },
  { id: "cyber", label: "Cyber", icon: Palette },
] as const;

const ThemeToggle = () => {
  const [theme, setTheme] = useState<string>("dark");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("df-theme") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const switchTheme = (t: string) => {
    setTheme(t);
    localStorage.setItem("df-theme", t);
    document.documentElement.setAttribute("data-theme", t);
    setOpen(false);
  };

  const current = THEMES.find((t) => t.id === theme) || THEMES[0];
  const Icon = current.icon;

  return (
    <div className="relative">
      <motion.button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
      >
        <Icon size={18} />
      </motion.button>
      {open && (
        <motion.div
          className="absolute right-0 top-12 glass-strong rounded-xl p-2 flex flex-col gap-1 min-w-[140px] z-50 border border-border/50"
          initial={{ opacity: 0, y: -10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
        >
          {THEMES.map((t) => (
            <motion.button
              key={t.id}
              onClick={() => switchTheme(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                theme === t.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              whileHover={{ x: 4 }}
            >
              <t.icon size={14} />
              {t.label}
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default ThemeToggle;
