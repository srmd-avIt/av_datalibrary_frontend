import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, Users, MapPin, Clock, Building, Calendar, TrendingUp, Loader2 } from "lucide-react";

// Gurudev images for the slider from the public folder
const gurudevImages = [
  {
    src: "/images/Image1.jpg", // Assumes public/images/Image1.jpg
    title: "My Beloved Bapa",
    subtitle: "Divine presence guiding our spiritual journey"
  },
  {
    src: "/images/Image2.jpg", // Assumes public/images/Image2.jpg
    title: "Transforming Battles into Blessings",
    subtitle: "He transforms my battles into blessings"
  },
  {
    src: "/images/Image3.jpg", // Assumes public/images/Image3.jpg
    title: "Igniting the Path with Purpose",
    subtitle: "He ignites my path with purpose"
  },
  {
    src: "/images/Image4.jpg", // Assumes public/images/Image4.jpg
    title: "A Beacon of Hope",
    subtitle: "Guiding souls towards eternal peace"
  },
  {
    src: "/images/Image5.jpg", // Assumes public/images/Image5.jpg
    title: "The Essence of Seva",
    subtitle: "Inspiring selfless service in every heart"
  }
];

// --- API Base URL from .env ---
const API_BASE_URL = import.meta.env.VITE_API_URL;

// --- API Fetching Functions ---
const fetchDashboardSummary = async () => {
  // Fetches data for Satsangs and Users cards
  const response = await fetch(`${API_BASE_URL}/dashboard/summary`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

const fetchPratishthas = async () => {
  // Fetches data for the Pratishthas card
  const response = await fetch(`${API_BASE_URL}/newmedialog/pratishtha`);
  if (!response.ok) {
    throw new Error('Failed to fetch Pratishtha data.');
  }
  return response.json();
};

const fetchPadhramanis = async () => {
  // Fetches data for the Padhramanis card
  const response = await fetch(`${API_BASE_URL}/newmedialog/padhramani`);
  if (!response.ok) {
    throw new Error('Failed to fetch Padhramani data.');
  }
  return response.json();
};


export function Dashboard() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // --- Data Fetching for Summary Cards ---
  const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: fetchDashboardSummary,
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
  });

  // --- Data Fetching for Pratishthas ---
  const { data: pratishthaData, isLoading: isLoadingPratishtha, error: pratishthaError } = useQuery({
    queryKey: ['pratishthas'],
    queryFn: fetchPratishthas,
    staleTime: 1000 * 60 * 5,
  });

  // --- Data Fetching for Padhramanis ---
  const { data: padhramaniData, isLoading: isLoadingPadhramani, error: padhramaniError } = useQuery({
    queryKey: ['padhramanis'],
    queryFn: fetchPadhramanis,
    staleTime: 1000 * 60 * 5,
  });
  
  // Auto-advance slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % gurudevImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % gurudevImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + gurudevImages.length) % gurudevImages.length);
  };

  // --- Get counts from fetched data ---
  const lastModifiedDate = summaryData?.lastModifiedDate ? new Date(summaryData.lastModifiedDate) : new Date();
  const recentSatsangsCount = summaryData?.satsangs?.recentCount ?? 0;
  const recentUsersCount = summaryData?.users?.recentCount ?? 0;
  
  // Get counts from the separate API calls
  const pratishthasCount = pratishthaData?.count ?? 0;
  const padhramanisCount = padhramaniData?.count ?? 0;


  // Click handler for the Pratishthas/Padhramanis cards
  const handleShowRecent = (type: 'Pratishtha' | 'Padhramani') => {
    if (type === 'Pratishtha' && pratishthaData) {
      alert(`Showing ${pratishthaData.data.length} recent ${type} entries.`);
      console.log(pratishthaData.data);
    } else if (type === 'Padhramani' && padhramaniData) {
      alert(`Showing ${padhramaniData.data.length} recent ${type} entries.`);
      console.log(padhramaniData.data);
    }
  };


  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome to the spiritual data library</p>
        </div>
       <div className="text-sm text-muted-foreground">
          Last updated: {isLoadingSummary ? '...' : lastModifiedDate.toLocaleDateString()}
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
          {/* Remove aspect-square and max-h-96 */}
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
  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.4)")}
  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.2)")}
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
  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.4)")}
  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.2)")}
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

      {/* Recent Records Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Satsangs Card */}
        <Card
          style={{
            backgroundImage: "linear-gradient(to bottom right, rgba(59,130,246,0.1), rgba(37,99,235,0.1))",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: "0.5rem",
            padding: "1rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.5rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 500, margin: 0 }}>Recent Satsangs</h3>
            <Clock style={{ width: "1rem", height: "1rem", color: "rgb(59,130,246)" }} />
          </div>
          <div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "rgb(59,130,246)" }}>
              {isLoadingSummary ? <Loader2 className="w-6 h-6 animate-spin" /> : recentSatsangsCount}
            </div>
            <p style={{ fontSize: "0.75rem", color: "rgba(107,114,128,1)", margin: "0.25rem 0 0 0" }}>Added in last 15 days</p>
            <Badge variant="secondary" style={{ display: "inline-flex", alignItems: "center", marginTop: "0.5rem", fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}>
              <TrendingUp style={{ width: "0.75rem", height: "0.75rem", marginRight: "0.25rem" }} /> New sessions
            </Badge>
          </div>
        </Card>

        {/* Users Card */}
        <Card
          style={{
            backgroundImage: "linear-gradient(to bottom right, rgba(34,197,94,0.1), rgba(22,163,74,0.1))",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: "0.5rem",
            padding: "1rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.5rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 500, margin: 0 }}>New Users</h3>
            <Users style={{ width: "1rem", height: "1rem", color: "rgb(34,197,94)" }} />
          </div>
          <div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "rgb(34,197,94)" }}>
              {isLoadingSummary ? <Loader2 className="w-6 h-6 animate-spin" /> : recentUsersCount}
            </div>
            <p style={{ fontSize: "0.75rem", color: "rgba(107,114,128,1)", margin: "0.25rem 0 0 0" }}>Joined in last 15 days</p>
            <Badge variant="secondary" style={{ display: "inline-flex", alignItems: "center", marginTop: "0.5rem", fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}>
              <Calendar style={{ width: "0.75rem", height: "0.75rem", marginRight: "0.25rem" }} /> Recent joins
            </Badge>
          </div>
        </Card>

        {/* Pratishthas Card */}
        <Card
          style={{
            backgroundImage: "linear-gradient(to bottom right, rgba(139,92,246,0.1), rgba(124,58,237,0.1))",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: "0.5rem",
            padding: "1rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.5rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 500, margin: 0 }}>New Pratishthas</h3>
            <Building style={{ width: "1rem", height: "1rem", color: "rgb(139,92,246)" }} />
          </div>
          <div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "rgb(139,92,246)" }}>
              {isLoadingPratishtha ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : pratishthaError ? (
                <span className="text-sm text-red-500">Error</span>
              ) : (
                pratishthasCount
              )}
            </div>
            <p style={{ fontSize: "0.75rem", color: "rgba(107,114,128,1)", margin: "0.25rem 0 0 0" }}>Established before last 15 days</p>
            <Badge onClick={() => handleShowRecent('Pratishtha')} variant="secondary" style={{ display: "inline-flex", alignItems: "center", marginTop: "0.5rem", fontSize: "0.75rem", padding: "0.25rem 0.5rem", cursor: "pointer" }} className="hover:bg-muted/80">
              <MapPin style={{ width: "0.75rem", height: "0.75rem", marginRight: "0.25rem" }} /> New centers
            </Badge>
          </div>
        </Card>

        {/* Padhramanis Card */}
        <Card
          style={{
            backgroundImage: "linear-gradient(to bottom right, rgba(251,146,60,0.1), rgba(249,115,22,0.1))",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(251,146,60,0.2)",
            borderRadius: "0.5rem",
            padding: "1rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.5rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 500, margin: 0 }}>New Padhramanis</h3>
            <Building style={{ width: "1rem", height: "1rem", color: "rgb(251,146,60)" }} />
          </div>
          <div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "rgb(251,146,60)" }}>
              {isLoadingPadhramani ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : padhramaniError ? (
                <span className="text-sm text-red-500">Error</span>
              ) : (
                padhramanisCount
              )}
            </div>
            <p style={{ fontSize: "0.75rem", color: "rgba(107,114,128,1)", margin: "0.25rem 0 0 0" }}>Established before last 15 days</p>
            <Badge onClick={() => handleShowRecent('Padhramani')} variant="secondary" style={{ display: "inline-flex", alignItems: "center", marginTop: "0.5rem", fontSize: "0.75rem", padding: "0.25rem 0.5rem", cursor: "pointer" }} className="hover:bg-muted/80">
              <MapPin style={{ width: "0.75rem", height: "0.75rem", marginRight: "0.25rem" }} /> New locations
            </Badge>
          </div>
        </Card>

      </div>
    </div>
  );
}