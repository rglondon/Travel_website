import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface MissionBriefingProps {
  onComplete: () => void;
  galleryTitle?: string;
  galleryDescription?: string;
}

export function MissionBriefing({ onComplete, galleryTitle, galleryDescription }: MissionBriefingProps) {
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (confirmed) {
      const t = setTimeout(() => onComplete(), 2500);
      return () => clearTimeout(t);
    }
  }, [confirmed, onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-background flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative z-10 max-w-4xl w-full p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center"
        >
          <h2 className="font-mono text-xs tracking-[0.5em] mb-8 text-muted-foreground uppercase">
            {galleryTitle ? `Destination // ${galleryTitle}` : "Mission Asset 01 // Boarding Pass"}
          </h2>
          
          <motion.div 
            className="relative cursor-pointer"
            onClick={() => setConfirmed(true)}
            whileHover={{ 
              filter: "brightness(1.1) drop-shadow(0 0 15px rgba(255,255,255,0.3))",
              transition: { duration: 0.3 }
            }}
          >
            <img 
              src="/images/safari_baggage_tag_refined.webp" 
              alt="Expedition Ticket" 
              className="w-full max-w-2xl shadow-2xl"
            />
          </motion.div>
            
            {/* CONFIRM / ROUTING NOW - same coordinates */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-48 flex flex-col items-center">
              
              {/* CONFIRM with blinking cursor */}
              {!confirmed && (
                <motion.div 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setConfirmed(true)}
                >
                  <span className="font-mono text-xs text-destructive tracking-widest">
                    CONFIRM
                  </span>
                  <motion.span
                    className="w-2 h-4 bg-destructive"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                </motion.div>
              )}
              
              {/* ROUTING NOW with processing bar */}
              {confirmed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center translate-y-[25px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-destructive tracking-widest">
                      ROUTING NOW
                    </span>
                    <motion.span
                      className="w-2 h-4 bg-destructive"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                  </div>
                  {/* Horizontal processing bar */}
                  <div className="w-32 h-[1px] bg-foreground/20 mt-6 overflow-hidden">
                    <motion.div
                      className="h-full bg-destructive"
                      initial={{ width: "0%", left: 0 }}
                      animate={{ width: "100%", left: 0 }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    />
                  </div>
                </motion.div>
              )}
            </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
