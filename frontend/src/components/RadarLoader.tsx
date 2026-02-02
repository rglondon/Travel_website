import { motion } from "framer-motion";

export function RadarLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="relative flex flex-col items-center gap-8">
        {/* Radar Circle */}
        <div className="relative w-32 h-32 rounded-full border border-foreground/20 overflow-hidden">
          {/* Grid Lines */}
          <div className="absolute inset-0 border-r border-foreground/10 left-1/2 -translate-x-1/2" />
          <div className="absolute inset-0 border-b border-foreground/10 top-1/2 -translate-y-1/2" />
          
          {/* Sweep Animation */}
          <motion.div 
            className="absolute inset-0 origin-center bg-gradient-to-r from-transparent via-destructive/20 to-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ clipPath: "polygon(50% 50%, 100% 0, 100% 100%)" }}
          />
          
          {/* Blip */}
          <motion.div 
            className="absolute top-8 right-8 w-2 h-2 bg-destructive rounded-full shadow-[0_0_10px_rgba(255,0,0,0.8)]"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, times: [0.4, 0.5, 0.6] }}
          />
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-xs tracking-[0.2em] animate-pulse text-destructive">
            ACQUIRING ASSETS
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            DOWNLOADING HIGH-RES TELEMETRY...
          </span>
        </div>
      </div>
    </div>
  );
}
