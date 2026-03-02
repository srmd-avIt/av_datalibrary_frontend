import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Gurudev images for the slider from the public folder
const gurudevImages = [
  { src: "/images/Image1.jpg" },
  { src: "/images/Image2.jpg" },
  { src: "/images/Image3.jpg" },
  { src: "/images/Image4.jpg" },
  { src: "/images/Image5.jpg" }
];

export function Dashboard() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // 1. Detect Mobile AND Force Body Background Color
  useEffect(() => {
    const checkIsMobile = () => {
      const mobileState = window.innerWidth <= 768;
      setIsMobile(mobileState);
      
      if (mobileState) {
        document.body.style.backgroundColor = "#0b1120";
      } else {
        document.body.style.backgroundColor = "";
      }
    };
    
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    
    return () => {
      window.removeEventListener("resize", checkIsMobile);
      document.body.style.backgroundColor = "";
    };
  }, []);

  // 2. Auto-advance slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % gurudevImages.length);
    }, 11000);
    return () => clearInterval(interval);
  }, []);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % gurudevImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + gurudevImages.length) % gurudevImages.length);
  };

  // ==========================================
  // 📱 MOBILE UI
  // ==========================================
  const renderMobileView = () => (
    <div 
      className="text-white pb-20"
      style={{
        minHeight: "100vh",
        backgroundColor: "#0b1120",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Mobile Header */}
      <div className="px-5 pt-4 pb-2">
        <h1 className="text-2xl font-bold tracking-tight">Home</h1>
        <p className="text-gray-400 text-sm mt-1">Welcome to our data library</p>
      </div>

      {/* Mobile App-Style Slider */}
      <div className="relative w-full h-[380px] bg-slate-900 mt-2">
        <img
          src={gurudevImages[currentImageIndex].src}
          alt="Slider"
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-black/40 to-transparent" />

        {/* Mobile Dots */}
        <div className="absolute bottom-4 w-full flex justify-center gap-3">
          {gurudevImages.map((_, index) => (
            <div
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentImageIndex ? "w-8 bg-white" : "w-2.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  // ==========================================
  // 💻 DESKTOP UI
  // ==========================================
  const renderDesktopView = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Home</h1>
          <p className="text-muted-foreground mt-1">Welcome to our data library</p>
        </div>
      </div>

      <Card
        style={{
          position: "relative",
          overflow: "hidden",
          backgroundImage: "linear-gradient(to right, rgba(15,23,42,0.5), rgba(30,41,59,0.5))", 
          backdropFilter: "blur(4px)", 
          border: "1px solid rgba(51,65,85,0.5)", 
        }}
      >
        <div className="relative w-full flex flex-col items-center">
          <div
            style={{
              width: "100%", display: "flex", justifyContent: "center", alignItems: "center",
              backgroundColor: "rgba(30,41,59,0.3)", minHeight: 200, position: "relative", 
            }}
          >
            <img
              src={gurudevImages[currentImageIndex].src}
              alt="Slider"
              style={{
                maxWidth: "100%", maxHeight: "400px", width: "auto", height: "auto",
                display: "block", margin: "0 auto",
              }}
            />
            <div
              style={{
                position: "absolute", inset: 0, 
                background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent 50%, transparent 100%)",
                pointerEvents: "none",
              }}
            />
          </div>

          <Button
            onClick={prevImage}
            style={{
              position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", 
              backgroundColor: "rgba(0,0,0,0.2)", color: "#ffffff", border: "none", padding: "0.5rem", cursor: "pointer",
            }}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            onClick={nextImage}
            style={{
              position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", 
              backgroundColor: "rgba(0,0,0,0.2)", color: "#ffffff", border: "none", padding: "0.5rem", cursor: "pointer",
            }}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          <div style={{ position: "absolute", bottom: "1rem", right: "1.5rem", display: "flex", gap: "0.5rem" }}>
            {gurudevImages.map((_, index) => (
              <div
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                style={{
                  width: "8px", height: "8px", borderRadius: "50%", 
                  backgroundColor: index === currentImageIndex ? "#ffffff" : "rgba(255,255,255,0.4)", 
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );

  return isMobile ? renderMobileView() : renderDesktopView();
}