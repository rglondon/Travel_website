import { useEffect, useState } from "react";

export function HUD() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 p-8 font-mono text-[10px] tracking-widest text-muted-foreground uppercase flex flex-col justify-between">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          {/* Removed ARRIVAL TERMINAL and SYS.VER */}
        </div>
        {/* Date and time removed */}
      </div>

      {/* Bottom Bar */}
      <div className="flex justify-between items-end">
        {/* Coordinates only */}
        <div className="flex flex-col gap-1 translate-x-5">
          <span>COORDINATES</span>
          <span className="text-foreground">01.48° S, 35.14° E</span>
        </div>
        
        <div className="flex flex-col gap-1 text-right -translate-x-5">
          <span>SYS.VER.2.0.26 / STATUS : <span className="text-[#00ff00]">ONLINE</span></span>
        </div>
      </div>
      
      {/* Center Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-border/50 opacity-20">
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-border/50" />
        <div className="absolute left-1/2 top-0 h-full w-[1px] bg-border/50" />
      </div>
    </div>
  );
}
