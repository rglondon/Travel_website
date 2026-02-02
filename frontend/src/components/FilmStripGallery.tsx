import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { safariPhotos } from "@/data/safari";

const photos = [
  safariPhotos[0]?.src,
  safariPhotos[1]?.src,
  safariPhotos[2]?.src,
  safariPhotos[3]?.src,
  safariPhotos[0]?.src,
].filter(Boolean) as string[];

export function FilmStripGallery() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

  return (
    <section ref={targetRef} className="relative h-[300vh] bg-background">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div style={{ x }} className="flex gap-12 px-20">
          {/* Intro Card */}
          <div className="relative h-[60vh] w-[30vw] flex-shrink-0 flex flex-col justify-center border-r border-foreground/10 pr-12">
            <h2 className="text-6xl font-bold tracking-tighter mb-4">
              FILM STRIP
            </h2>
            <p className="text-muted-foreground font-mono text-sm">
              A linear, cinematic journey through the Mara.
              Scroll to advance the reel.
            </p>
          </div>

          {/* Photos */}
          {photos.map((src, index) => (
            <div 
              key={index} 
              className="relative h-[60vh] aspect-[3/2] flex-shrink-0 overflow-hidden group"
            >
              <motion.img
                src={src}
                alt={`Safari ${index + 1}`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                initial={{ filter: "grayscale(100%)" }}
                whileInView={{ filter: "grayscale(0%)" }}
                viewport={{ amount: 0.5 }}
                transition={{ duration: 0.5 }}
              />
              <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="font-mono text-xs text-white tracking-widest">
                  IMG_00{index + 1} // RAW
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
