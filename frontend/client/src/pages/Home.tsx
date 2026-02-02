import { Beacon } from "@/components/Beacon";
import { HUD } from "@/components/HUD";
import { MissionBriefing } from "@/components/MissionBriefing";
import { Radar } from "@/components/Radar";
import { RadarLoader } from "@/components/RadarLoader";
import { SafariGallery } from "@/components/SafariGallery";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { 
  fetchGalleries, 
  fetchGalleryBySlug, 
  transformPhoto,
  type Gallery, 
  type GalleryPhoto 
} from "@/services/galleryApi";

type PhotoType = {
  src: string;
  alt: string;
  iso: string;
  aperture: string;
  shutter: string;
  camera: string;
  lens: string;
  location: string;
  fieldJournal?: string;
};

// User Icon - for account menu
const UserIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);

// Beacon positions for known locations (can be expanded)
const beaconPositions: Record<string, { x: number; y: number; coordinates: string; timezone: string }> = {
  "masai-mara": { x: 25, y: 35, coordinates: "01.48° S, 35.14° E", timezone: "EAT" },
  "varanasi": { x: 65, y: 25, coordinates: "25.31° N, 82.97° E", timezone: "IST" },
  "tokyo": { x: 45, y: 75, coordinates: "35.67° N, 139.65° E", timezone: "JST" },
  "paris": { x: 30, y: 20, coordinates: "48.85° N, 2.35° E", timezone: "CET" },
  "new-york": { x: 15, y: 40, coordinates: "40.71° N, 74.00° W", timezone: "EST" },
};

// Generate a position for unknown locations
function getBeaconPosition(slug: string, index: number) {
  if (beaconPositions[slug]) {
    return beaconPositions[slug];
  }
  // Generate pseudo-random but consistent positions based on slug
  const hash = slug.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return {
    x: 20 + (hash % 60),
    y: 20 + ((hash * 7) % 50),
    coordinates: "Unknown",
    timezone: "UTC",
  };
}

export default function Home() {
  const [view, setView] = useState<"terminal" | "briefing" | "gallery">("terminal");
  const [isLoading, setIsLoading] = useState(true);
  const [galleryView, setGalleryView] = useState<"filmstrip" | "mosaic">("filmstrip");
  const [lightbox, setLightbox] = useState<PhotoType[]>([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // API state
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<PhotoType[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);

  // Fetch galleries on mount
  useEffect(() => {
    const loadGalleries = async () => {
      const data = await fetchGalleries();
      setGalleries(data);
    };
    loadGalleries();
  }, []);

  // Simulate initial asset loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Load lightbox from localStorage on mount
  useEffect(() => {
    const savedLightbox = localStorage.getItem("photo-lightbox");
    if (savedLightbox) {
      try {
        setLightbox(JSON.parse(savedLightbox));
      } catch (e) {
        console.error("Failed to parse lightbox from localStorage", e);
      }
    }
  }, []);

  // Save lightbox to localStorage on change
  useEffect(() => {
    localStorage.setItem("photo-lightbox", JSON.stringify(lightbox));
  }, [lightbox]);

  // Handle beacon click - fetch gallery and show briefing
  const handleBeaconClick = useCallback(async (gallery: Gallery) => {
    setSelectedGallery(gallery);
    setIsLoadingPhotos(true);
    
    try {
      const data = await fetchGalleryBySlug(gallery.slug);
      if (data) {
        const transformedPhotos = data.photos.map(transformPhoto);
        setGalleryPhotos(transformedPhotos);
      }
    } catch (error) {
      console.error("Error loading gallery:", error);
    } finally {
      setIsLoadingPhotos(false);
    }
    
    setView("briefing");
  }, []);

  // Get current time for a timezone (simplified)
  const getTimeForTimezone = (tz: string) => {
    const now = new Date();
    const hours = now.getUTCHours();
    const mins = now.getUTCMinutes().toString().padStart(2, "0");
    
    const offsets: Record<string, number> = {
      "EAT": 3, "IST": 5.5, "JST": 9, "CET": 1, "EST": -5, "UTC": 0
    };
    const offset = offsets[tz] || 0;
    const localHours = (hours + offset + 24) % 24;
    const ampm = localHours >= 12 ? "PM" : "AM";
    const displayHours = localHours % 12 || 12;
    
    return `${displayHours.toString().padStart(2, "0")}:${mins} ${ampm} ${tz}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative selection:bg-destructive/20">
      <AnimatePresence>
        {isLoading && (
          <motion.div key="loader" exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <RadarLoader />
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && <HUD />}
      
      <AnimatePresence mode="wait">
        {view === "terminal" && (
          <motion.div
            key="terminal"
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="relative w-full h-screen overflow-hidden"
          >
            <Radar />
            <main className="relative z-10 w-full h-screen">
              {/* Top navigation bar - Account + Social Icons */}
              <div className="fixed top-8 left-8 z-50 flex items-center gap-4">
                {/* Account Icon - no border, no text */}
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="p-2 hover:bg-muted/20 rounded-full transition-colors"
                >
                  <UserIcon className="w-5 h-5" />
                </button>
                
                {/* Social Media Icons - subtle */}
                <div className="flex items-center gap-2">
                  <button onClick={() => window.open('https://instagram.com', '_blank')} className="p-1.5 hover:bg-muted/20 rounded-full transition-colors opacity-60">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </button>
                  <button onClick={() => window.open('https://twitter.com', '_blank')} className="p-1.5 hover:bg-muted/20 rounded-full transition-colors opacity-60">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-60">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </button>
                  <button onClick={() => window.open('https://pinterest.com', '_blank')} className="p-1.5 hover:bg-muted/20 rounded-full transition-colors opacity-60">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-60">
                      <path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* User menu dropdown */}
              {isUserMenuOpen && (
                <div className="fixed top-20 left-8 z-50 w-48 bg-background border border-border/50 rounded-lg shadow-lg overflow-hidden">
                  <div className="p-3 border-b border-border/50">
                    <p className="font-mono text-xs text-muted-foreground">Guest User</p>
                    <p className="font-mono text-[10px] text-muted-foreground/60">Sign in for personalized lightboxes</p>
                  </div>
                  <div className="p-2">
                    <a
                      href="http://95.216.147.140:3001/admin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-left px-3 py-2 font-mono text-xs hover:bg-[#00ff00]/20 rounded transition-colors text-[#00ff00]"
                    >
                      → Admin Dashboard
                    </a>
                    <div className="border-t border-border/30 my-1" />
                    <button className="w-full text-left px-3 py-2 font-mono text-xs hover:bg-muted/50 rounded transition-colors">
                      Sign In
                    </button>
                    <button className="w-full text-left px-3 py-2 font-mono text-xs hover:bg-muted/50 rounded transition-colors">
                      Create Account
                    </button>
                    <button onClick={() => setLightbox([])} className="w-full text-left px-3 py-2 font-mono text-xs hover:bg-muted/50 rounded transition-colors text-destructive hover:text-destructive">
                      Clear Local Lightbox
                    </button>
                  </div>
                </div>
              )}

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-10">
                <h1 className="text-[12vw] font-bold tracking-tighter leading-none font-sans">
                  EXPEDITION
                </h1>
              </div>

              {/* Dynamic Beacons from API */}
              {galleries.map((gallery, index) => {
                const pos = getBeaconPosition(gallery.slug, index);
                return (
                  <Beacon
                    key={gallery.id}
                    x={pos.x}
                    y={pos.y}
                    location={gallery.title}
                    coordinates={pos.coordinates}
                    time={getTimeForTimezone(pos.timezone)}
                    delay={0.5 + index * 0.7}
                    onClick={() => handleBeaconClick(gallery)}
                  />
                );
              })}

              {/* Fallback beacons if no galleries loaded */}
              {galleries.length === 0 && (
                <>
                  <Beacon 
                    x={25} 
                    y={35} 
                    location="Loading..."
                    coordinates="--° --, --° --"
                    time="--:-- --"
                    delay={0.5}
                  />
                </>
              )}

              <motion.div 
                className="absolute bottom-12 left-1/2 -translate-x-1/2 cursor-pointer group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3, duration: 1 }}
                onClick={() => {
                  if (galleries.length > 0) {
                    handleBeaconClick(galleries[0]);
                  }
                }}
              >
                <span className="font-mono text-xs tracking-[0.5em] text-muted-foreground group-hover:text-foreground transition-colors">
                  INITIALIZE SEQUENCE
                </span>
                <div className="h-[1px] w-0 group-hover:w-full bg-destructive transition-all duration-500 mt-2 mx-auto" />
              </motion.div>
            </main>
          </motion.div>
        )}

        {view === "briefing" && (
          <MissionBriefing 
            key="briefing" 
            onComplete={() => setView("gallery")}
            galleryTitle={selectedGallery?.title}
            galleryDescription={selectedGallery?.description}
          />
        )}

        {view === "gallery" && (
          <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
            {/* Navigation */}
            <nav className="fixed top-[42px] left-8 z-50 flex items-center gap-4">
              <button 
                onClick={() => setView("terminal")}
                className="font-mono text-xs tracking-widest hover:text-destructive transition-colors"
              >
                ← TERMINAL
              </button>
              {selectedGallery && (
                <span className="font-mono text-xs tracking-widest text-muted-foreground">
                  / {selectedGallery.title.toUpperCase()}
                </span>
              )}
            </nav>

            {isLoadingPhotos ? (
              <div className="h-screen flex items-center justify-center">
                <div className="font-mono text-xs tracking-widest text-muted-foreground animate-pulse">
                  LOADING GALLERY...
                </div>
              </div>
            ) : (
              <SafariGallery 
                view={galleryView} 
                lightbox={lightbox} 
                setLightbox={setLightbox}
                onViewChange={setGalleryView}
                photos={galleryPhotos}
                galleryTitle={selectedGallery?.title || "Gallery"}
                galleryDescription={selectedGallery?.description}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
