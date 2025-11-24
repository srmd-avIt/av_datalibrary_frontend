import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Gurudev images for the slider from the public folder
const gurudevImages = [
  {
    src: "/images/Image1.jpg", // Assumes public/images/Image1.jpg
    title: "",
    subtitle: ""
  },
  {
    src: "/images/Image2.jpg", // Assumes public/images/Image2.jpg
    title: "",
    subtitle: ""
  },
  {
    src: "/images/Image3.jpg", // Assumes public/images/Image3.jpg
    title: "",
    subtitle: ""
  },
  {
    src: "/images/Image4.jpg", // Assumes public/images/Image4.jpg
    title: "",
    subtitle: ""
  },
  {
    src: "/images/Image5.jpg", // Assumes public/images/Image5.jpg
    title: "",
    subtitle: ""
  }
];

export function Dashboard() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-advance slider
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Home</h1>
          <p className="text-muted-foreground mt-1">Welcome to our data library </p>
        </div>
      </div>

      {/* Gurudev Image Slider */}
      <Card
        style={{
          position: "relative",
          overflow: "hidden",
          backgroundImage: "linear-gradient(to right, rgba(15,23,42,0.5), rgba(30,41,59,0.5))", // from-slate-900/50 to-slate-800/50
          backdropFilter: "blur(4px)", // backdrop-blur-sm
          border: "1px solid rgba(51,65,85,0.5)", // border-slate-700/50
        }}
      >
        <div className="relative w-full flex flex-col items-center">
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(30,41,59,0.3)", // bg-slate-800/30
              minHeight: 200,
              position: "relative", // needed for the absolute overlay
            }}
          >
            <img
              src={gurudevImages[currentImageIndex].src}
              alt={gurudevImages[currentImageIndex].title}
              style={{
                maxWidth: "100%",
                maxHeight: "400px",
                width: "auto",
                height: "auto",
                display: "block",
                margin: "0 auto",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0, // shorthand for top:0; right:0; bottom:0; left:0
                background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent 50%, transparent 100%)",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Content overlay */}
          <div
            style={{
              position: "absolute",
              bottom: "1.5rem", // bottom-6
              left: "1.5rem",   // left-6
              color: "#ffffff",  // text-white
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",       // text-2xl
                fontWeight: 600,          // font-semibold
                marginBottom: "0.5rem",   // mb-2
              }}
            >
              {gurudevImages[currentImageIndex].title}
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.9)", // text-white/90
              }}
            >
              {gurudevImages[currentImageIndex].subtitle}
            </p>
          </div>

          {/* Navigation buttons */}
          <Button
            onClick={prevImage}
            style={{
              position: "absolute",
              left: "1rem",               // left-4
              top: "50%",                  // top-1/2
              transform: "translateY(-50%)", // -translate-y-1/2
              backgroundColor: "rgba(0,0,0,0.2)", // bg-black/20
              color: "#ffffff",            // text-white
              border: "none",              // border-none
              padding: "0.5rem",           // approximate size="icon"
              cursor: "pointer",
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.4)")}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.2)")}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            onClick={nextImage}
            style={{
              position: "absolute",
              right: "1rem",               // right-4
              top: "50%",                  // top-1/2
              transform: "translateY(-50%)", // -translate-y-1/2
              backgroundColor: "rgba(0,0,0,0.2)", // bg-black/20
              color: "#ffffff",            // text-white
              border: "none",              // border-none
              padding: "0.5rem",           // approximate size="icon"
              cursor: "pointer",
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.4)")}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.2)")}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Dots indicator */}
          <div
            style={{
              position: "absolute",
              bottom: "1rem", // bottom-4
              right: "1.5rem", // right-6
              display: "flex",
              gap: "0.5rem", // space-x-2
            }}
          >
            {gurudevImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                style={{
                  width: "0.5rem",   // w-2
                  height: "0.5rem",  // h-2
                  borderRadius: "50%", // rounded-full
                  backgroundColor: index === currentImageIndex ? "#ffffff" : "rgba(255,255,255,0.4)", // bg-white or bg-white/40
                  transition: "background-color 0.3s", // transition-colors
                  border: "none",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}