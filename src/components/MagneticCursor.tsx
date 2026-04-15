import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const MagneticCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const dotX = useSpring(cursorX, { damping: 25, stiffness: 300 });
  const dotY = useSpring(cursorY, { damping: 25, stiffness: 300 });
  const ringX = useSpring(cursorX, { damping: 18, stiffness: 150 });
  const ringY = useSpring(cursorY, { damping: 18, stiffness: 150 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const checkHover = () => {
      const target = document.elementFromPoint(cursorX.get(), cursorY.get());
      const interactive = target?.closest("button, a, input, label, [role='button'], .cursor-pointer");
      setIsHovering(!!interactive);
    };

    const down = () => setIsClicking(true);
    const up = () => setIsClicking(false);

    window.addEventListener("mousemove", move);
    window.addEventListener("mousemove", checkHover);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousemove", checkHover);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  }, [isMobile, cursorX, cursorY]);

  if (isMobile) return null;

  return (
    <>
      {/* Dot */}
      <motion.div
        className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference"
        style={{
          x: dotX,
          y: dotY,
          width: isClicking ? 6 : 8,
          height: isClicking ? 6 : 8,
          borderRadius: "50%",
          backgroundColor: "white",
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
      {/* Ring */}
      <motion.div
        className="fixed top-0 left-0 z-[9998] pointer-events-none"
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: isClicking ? 20 : isHovering ? 50 : 36,
          height: isClicking ? 20 : isHovering ? 50 : 36,
          borderWidth: isHovering ? 2 : 1.5,
          opacity: 0.5,
        }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        <div
          className="w-full h-full rounded-full border-primary/60"
          style={{
            borderWidth: "inherit",
            borderStyle: "solid",
            borderColor: isHovering ? "hsl(var(--primary))" : "rgba(255,255,255,0.4)",
            background: isHovering ? "hsl(var(--primary) / 0.08)" : "transparent",
          }}
        />
      </motion.div>
    </>
  );
};

export default MagneticCursor;
