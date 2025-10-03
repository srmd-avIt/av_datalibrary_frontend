import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, Users, MapPin, Clock, Building, Calendar, TrendingUp } from "lucide-react";

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

// --- DUMMY DATA ---
// This data replaces the live API calls for now.
const satsangData = [
  { id: 1, date: '2025-09-30T10:00:00Z' }, // Recent
  { id: 2, date: '2025-09-25T10:00:00Z' }, // Recent
  { id: 3, date: '2025-08-01T10:00:00Z' },
];

const usersData = [
  { id: 1, joinedDateTime: '2025-09-28T12:00:00Z' }, // Recent
  { id: 2, joinedDateTime: '2025-07-15T12:00:00Z' },
  { id: 3, joinedDateTime: '2025-09-20T12:00:00Z' }, // Recent
];

const pratishthasData = [
  { id: 1, establishedDate: '2025-09-29T09:00:00Z' }, // Recent
  { id: 2, establishedDate: '2025-06-10T09:00:00Z' },
];

const padhramanisData = [
  { id: 1, establishedDate: '2025-09-22T18:00:00Z' }, // Recent
  { id: 2, establishedDate: '2025-09-21T18:00:00Z' }, // Recent
  { id: 3, establishedDate: '2025-09-20T18:00:00Z' }, // Recent
  { id: 4, establishedDate: '2025-05-05T18:00:00Z' },
];
// --- END DUMMY DATA ---

export function Dashboard() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
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

  // Calculate records added in last 15 days
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  const getRecentRecords = (data: any[], dateField: string) => {
    if (!data) return 0;
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= fifteenDaysAgo;
    }).length;
  };

  const recentSatsangs = getRecentRecords(satsangData, 'date');
  const recentUsers = getRecentRecords(usersData?.map(user => ({ joinedDate: user.joinedDateTime })), 'joinedDate');
  const recentPratishthas = getRecentRecords(pratishthasData, 'establishedDate');
  const recentPadhramanis = getRecentRecords(padhramanisData, 'establishedDate');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome to the spiritual data library</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Gurudev Image Slider */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-sm border-slate-700/50">
        <div className="relative w-full flex flex-col items-center">
          {/* Remove aspect-square and max-h-96 */}
          <div className="w-full flex justify-center items-center bg-slate-800/30" style={{ minHeight: 200 }}>
            <img
              src={gurudevImages[currentImageIndex].src}
              alt={gurudevImages[currentImageIndex].title}
              style={{
                maxWidth: "100%",
                maxHeight: "400px", // adjust as needed
                height: "auto",
                width: "auto",
                display: "block",
                margin: "0 auto"
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>
          
          {/* Content overlay */}
          <div className="absolute bottom-6 left-6 text-white">
            <h2 className="text-2xl font-semibold mb-2">{gurudevImages[currentImageIndex].title}</h2>
            <p className="text-white/90">{gurudevImages[currentImageIndex].subtitle}</p>
          </div>

          {/* Navigation buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white border-none"
            onClick={prevImage}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white border-none"
            onClick={nextImage}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Dots indicator */}
          <div className="absolute bottom-4 right-6 flex space-x-2">
            {gurudevImages.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                }`}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Recent Records Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Satsangs</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{recentSatsangs}</div>
            <p className="text-xs text-muted-foreground">
              Added in last 15 days
            </p>
            <Badge variant="secondary" className="mt-2 text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              New sessions
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-sm border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{recentUsers}</div>
            <p className="text-xs text-muted-foreground">
              Joined in last 15 days
            </p>
            <Badge variant="secondary" className="mt-2 text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              Recent joins
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-sm border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Pratishthas</CardTitle>
            <Building className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{recentPratishthas}</div>
            <p className="text-xs text-muted-foreground">
              Established in last 15 days
            </p>
            <Badge variant="secondary" className="mt-2 text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              New centers
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 backdrop-blur-sm border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Padhramanis</CardTitle>
            <Building className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{recentPadhramanis}</div>
            <p className="text-xs text-muted-foreground">
              Established in last 15 days
            </p>
            <Badge variant="secondary" className="mt-2 text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              New locations
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}