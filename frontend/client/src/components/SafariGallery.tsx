import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

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

// Horizontal Film Strip Icon
const FilmStripIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <rect x="2" y="6" width="20" height="12" rx="1" />
    <line x1="6" y1="6" x2="6" y2="18" strokeLinecap="round" />
    <line x1="10" y1="6" x2="10" y2="18" strokeLinecap="round" />
    <line x1="14" y1="6" x2="14" y2="18" strokeLinecap="round" />
    <line x1="18" y1="6" x2="18" y2="18" strokeLinecap="round" />
  </svg>
);

// Mosaic Icon - irregular squares and rectangles
const MosaicIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <rect x="2" y="2" width="8" height="8" rx="0.5" />
    <rect x="14" y="2" width="8" height="12" rx="0.5" />
    <rect x="2" y="14" width="8" height="8" rx="0.5" />
    <rect x="14" y="17" width="8" height="5" rx="0.5" />
  </svg>
);

// X/Twitter Icon - filled
const XIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// Pinterest Icon - filled
const PinterestIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
  </svg>
);

// Lightbox Camera Icon
const CameraIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17 8h.01" />
  </svg>
);

interface GalleryProps {
  view: "filmstrip" | "mosaic";
  lightbox: PhotoType[];
  setLightbox: React.Dispatch<React.SetStateAction<PhotoType[]>>;
  onViewChange: (view: "filmstrip" | "mosaic") => void;
  photos: PhotoType[];
  galleryTitle?: string;
  galleryDescription?: string;
}

export function SafariGallery({ 
  view, 
  lightbox, 
  setLightbox, 
  onViewChange, 
  photos,
  galleryTitle = "Gallery",
  galleryDescription 
}: GalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoType | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const scrollBy = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  };

  const addToLightbox = (photo: PhotoType) => {
    if (!lightbox.find(p => p.src === photo.src)) {
      setLightbox([...lightbox, photo]);
    }
  };

  const removeFromLightbox = (photo: PhotoType) => {
    setLightbox(lightbox.filter(p => p.src !== photo.src));
  };

  const shareToSocial = (platform: string, photo: PhotoType) => {
    const url = encodeURIComponent(window.location.href);
    const shareUrl = `https://www.${platform}.com/sharer/sharer.php?u=${url}`;
    window.open(shareUrl, "_blank");
  };

  // Zoom Modal Component
  const ZoomModal = ({ photo }: { photo: PhotoType }) => {
    const isInLightbox = lightbox.find(p => p.src === photo.src);

    return (
      <div
        className="fixed inset-0 z-50 bg-background/98 flex flex-col items-center justify-center pt-10"
        onClick={() => setSelectedPhoto(null)}
      >
        {/* Back Button */}
        <button
          onClick={() => setSelectedPhoto(null)}
          className="absolute top-8 left-8 z-50 p-2 hover:bg-muted/20 rounded-full transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>

        {/* Add to Lightbox Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            isInLightbox ? removeFromLightbox(photo) : addToLightbox(photo);
          }}
          className={`absolute top-8 left-32 z-50 flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${
            isInLightbox
              ? "text-destructive hover:bg-destructive/10"
              : "text-foreground hover:bg-muted/20"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M8 12h8M12 8v8" />
          </svg>
          <span className="font-mono text-[10px] tracking-widest">
            {isInLightbox ? "IN LIGHTBOX" : "ADD TO LIGHTBOX"}
          </span>
        </button>

        {/* Social Share - subtle */}
        <div className="absolute top-8 right-8 flex items-center gap-3 z-50">
          <button onClick={(e) => { e.stopPropagation(); shareToSocial('instagram', photo); }} className="p-2 hover:bg-muted/20 rounded-full transition-colors opacity-50">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); shareToSocial('twitter', photo); }} className="p-2 hover:bg-muted/20 rounded-full transition-colors opacity-50">
            <XIcon className="w-5 h-5 opacity-50" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); shareToSocial('pinterest', photo); }} className="p-2 hover:bg-muted/20 rounded-full transition-colors opacity-50">
            <PinterestIcon className="w-5 h-5 opacity-50" />
          </button>
        </div>

        {/* Image */}
        <img
          src={photo.src}
          alt={photo.alt}
          className="max-w-[90vw] max-h-[72vh] object-contain cursor-zoom-out mt-2.5"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Metadata */}
        <div className="mt-4 text-left w-full max-w-[90vw] pl-[42px]">
          <h2 className="font-mono text-[10px] uppercase tracking-widest">{photo.alt}</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[10px] text-muted-foreground/60 mt-1 pl-[2px]">
            <span>{photo.location}</span>
            <span>ISO {photo.iso}</span>
            <span>{photo.aperture}</span>
            <span>{photo.shutter}</span>
            <span>{photo.camera}</span>
            <span>{photo.lens}</span>
          </div>
          {photo.fieldJournal && (
            <p className="font-mono text-[10px] text-muted-foreground mt-3 max-w-2xl leading-relaxed">
              {photo.fieldJournal}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Navigation Bar Component
  const NavigationBar = () => (
    <div className="fixed top-8 right-[26px] z-50 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-full px-4 py-1.5 min-w-[180px]">
      {/* Social Share Icons */}
      <button onClick={() => window.open('https://instagram.com', '_blank')} className="p-1.5 hover:bg-muted/20 rounded-full transition-colors opacity-50">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      </button>
      <button onClick={() => window.open('https://twitter.com', '_blank')} className="p-1.5 hover:bg-muted/20 rounded-full transition-colors opacity-50">
        <XIcon className="w-4 h-4 opacity-50" />
      </button>
      <button onClick={() => window.open('https://pinterest.com', '_blank')} className="p-1.5 hover:bg-muted/20 rounded-full transition-colors opacity-50">
        <PinterestIcon className="w-4 h-4 opacity-50" />
      </button>
      
      <div className="w-[1px] h-4 bg-border/50 mx-1" />
      
      {/* View Toggle */}
      <button
        onClick={() => onViewChange("filmstrip")}
        className={`p-1.5 rounded-full transition-all ${view === "filmstrip" ? "bg-[#00ff00] text-black" : "text-black/70 hover:text-black"}`}
        title="Film Strip View"
      >
        <FilmStripIcon className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewChange("mosaic")}
        className={`p-1.5 rounded-full transition-all ${view === "mosaic" ? "bg-[#00ff00] text-black" : "text-black/70 hover:text-black"}`}
        title="Mosaic View"
      >
        <MosaicIcon className="w-4 h-4" />
      </button>
      
      {/* Lightbox Camera Icon */}
      <button 
        className={`p-1.5 rounded-full transition-all relative ${lightbox.length > 0 ? "bg-[#00ff00] text-black" : "text-black/70 hover:text-black"}`}
        title={`Lightbox (${lightbox.length})`}
      >
        <CameraIcon className="w-4 h-4" />
        {lightbox.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 font-mono text-[9px] font-bold leading-none">
            {lightbox.length}
          </span>
        )}
      </button>
    </div>
  );

  // Empty state
  if (photos.length === 0) {
    return (
      <section className="h-screen bg-background flex items-center justify-center">
        <NavigationBar />
        <div className="text-center">
          <h2 className="font-mono text-lg tracking-widest text-muted-foreground">NO PHOTOS</h2>
          <p className="font-mono text-xs text-muted-foreground/60 mt-2">
            This gallery has no published photos yet.
          </p>
        </div>
      </section>
    );
  }

  if (view === "mosaic") {
    return (
      <section className="h-screen bg-background overflow-auto p-8 pt-[95px]">
        <NavigationBar />

        {/* Mosaic Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
          {photos.map((photo, index) => (
            <div
              key={`${photo.src}-${index}`}
              className="relative aspect-[4/5] cursor-zoom-in group overflow-hidden"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading={index < 4 ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Quick add to lightbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  lightbox.find(p => p.src === photo.src)
                    ? removeFromLightbox(photo)
                    : addToLightbox(photo);
                }}
                className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {lightbox.find(p => p.src === photo.src) ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-destructive">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Zoom Modal */}
        {selectedPhoto && <ZoomModal photo={selectedPhoto} />}
      </section>
    );
  }

  // Film strip view (default)
  return (
    <section className="h-screen bg-background overflow-hidden">
      <NavigationBar />

      <div
        ref={scrollRef}
        className="flex items-center h-full overflow-x-auto overflow-y-hidden gap-6 px-8 pt-14 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Title section */}
        <div className="relative h-[80vh] w-[35vw] min-w-[400px] flex-shrink-0 flex flex-col justify-center">
          <h2 className="text-[8vw] font-bold leading-none tracking-tighter text-foreground/10 select-none">
            {galleryTitle.toUpperCase().slice(0, 6)}
          </h2>
          <div className="relative z-10 -mt-12">
            <h3 className="text-3xl font-mono font-light tracking-widest mb-2">
              {galleryTitle.toUpperCase()}
            </h3>
            {galleryDescription && (
              <p className="max-w-xs font-mono text-xs text-muted-foreground leading-relaxed mt-4 mb-6">
                {galleryDescription}
              </p>
            )}
            <div className="flex items-center gap-3 text-muted-foreground/40 mb-8">
              <div className="w-8 h-[1px] bg-current" />
              <span className="font-mono text-[9px] tracking-widest uppercase">
                Scroll to Explore
              </span>
            </div>
          </div>
        </div>

        {/* Photos */}
        {photos.map((photo, index) => (
          <div
            key={`${photo.src}-${index}`}
            className="flex-shrink-0 h-full flex flex-col justify-center"
          >
            <div
              className="h-[65vh] cursor-zoom-in relative group"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className="h-full w-auto object-contain"
                loading={index < 2 ? "eager" : "lazy"}
              />
              
              {/* Quick add to lightbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  lightbox.find(p => p.src === photo.src)
                    ? removeFromLightbox(photo)
                    : addToLightbox(photo);
                }}
                className="absolute top-0 right-0 p-2 bg-background/80 backdrop-blur-sm rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {lightbox.find(p => p.src === photo.src) ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-destructive">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                )}
              </button>
            </div>
            <div className="mt-3 space-y-1 font-mono text-[9px] text-muted-foreground/60">
              <div className="flex items-center justify-between">
                <span className="text-foreground/80 uppercase tracking-wider">{photo.alt}</span>
                <span className="text-muted-foreground/40">{photo.location}</span>
              </div>
              <div className="flex gap-4 text-[8px]">
                <span>ISO {photo.iso}</span>
                <span>{photo.aperture}</span>
                <span>{photo.shutter}</span>
                <span>{photo.camera}</span>
                <span>{photo.lens}</span>
              </div>
            </div>
          </div>
        ))}

        {/* End spacer */}
        <div className="flex-shrink-0 w-8" />
      </div>

      {/* Navigation arrows */}
      <button
        className="absolute left-4 bottom-6 w-8 h-8 flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors"
        onClick={() => scrollBy(-400)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        className="absolute right-4 bottom-6 w-8 h-8 flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors"
        onClick={() => scrollBy(400)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Zoom Modal */}
      {selectedPhoto && <ZoomModal photo={selectedPhoto} />}
    </section>
  );
}
