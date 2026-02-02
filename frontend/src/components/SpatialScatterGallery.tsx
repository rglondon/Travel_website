import { motion } from "framer-motion";
import { useRef } from "react";
import safariLandscape1 from "@/assets/images/safari_landscape_1.webp";
import safariLandscape2 from "@/assets/images/safari_landscape_2.webp";
import safariPhoto3 from "@/assets/images/safari_photo_3.webp";
import safariPhoto4 from "@/assets/images/safari_photo_4.webp";

const photos = [
  { src: safariLandscape1, x: 10, y: 20, rotate: -5 },
  { src: safariLandscape2, x: 50, y: 10, rotate: 3 },
  { src: safariPhoto3, x: 30, y: 60, rotate: -2 },
  { src: safariPhoto4, x: 70, y: 50, rotate: 5 },
  { src: safariLandscape1, x: 20, y: 80, rotate: 2 },
];

export function SpatialScatterGallery() {
  const constraintsRef = useRef(null);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-neutral-900 text-white">
      <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
        <h2 className="text-[10vw] font-bold opacity-5 select-none">
          SCATTER
        </h2>
      </div>

      <motion.div ref={constraintsRef} className="w-full h-full cursor-grab active:cursor-grabbing">
        {photos.map((photo, index) => (
          <motion.div
            key={index}
            drag
            dragConstraints={constraintsRef}
            initial={{ 
              x: `${photo.x}vw`, 
              y: `${photo.y}vh`, 
              rotate: photo.rotate,
              scale: 0.8,
              opacity: 0
            }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              transition: { delay: index * 0.2 }
            }}
            whileHover={{ scale: 1.1, zIndex: 50 }}
            whileDrag={{ scale: 1.2, zIndex: 100 }}
            className="absolute w-[20vw] aspect-[3/2] shadow-2xl"
          >
            <img 
              src={photo.src} 
              alt={`Scatter ${index}`} 
              className="w-full h-full object-cover border-4 border-white/10"
            />
          </motion.div>
        ))}
      </motion.div>
      
      <div className="absolute bottom-8 left-8 z-20 max-w-xs">
        <h3 className="font-mono text-xs tracking-widest mb-2 text-white/50">
          MODE: SPATIAL
        </h3>
        <p className="text-sm text-white/80">
          Drag photos to rearrange your own exhibition. 
          A non-linear exploration of the archive.
        </p>
      </div>
    </div>
  );
}
