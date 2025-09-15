import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface CountryData {
  country: string;
  code: string;
  pratishthas: number;
  padhramanis: number;
  coordinates: [number, number];
}

const mockCountryData: CountryData[] = [
  { country: "India", code: "IN", pratishthas: 125, padhramanis: 89, coordinates: [77.1025, 28.7041] },
  { country: "United States", code: "US", pratishthas: 45, padhramanis: 32, coordinates: [-95.7129, 37.0902] },
  { country: "United Kingdom", code: "GB", pratishthas: 23, padhramanis: 18, coordinates: [-3.4360, 55.3781] },
  { country: "Canada", code: "CA", pratishthas: 18, padhramanis: 14, coordinates: [-106.3468, 56.1304] },
  { country: "Australia", code: "AU", pratishthas: 12, padhramanis: 8, coordinates: [133.7751, -25.2744] },
  { country: "Germany", code: "DE", pratishthas: 15, padhramanis: 11, coordinates: [10.4515, 51.1657] },
  { country: "France", code: "FR", pratishthas: 9, padhramanis: 7, coordinates: [2.2137, 46.2276] },
];

export function WorldMap() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Global Distribution</CardTitle>
        <p className="text-sm text-muted-foreground">
          Pratishthas and Padhramanis by country
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-96 bg-muted/30 rounded-lg overflow-hidden">
          {/* Simplified world map background */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
            <svg
              viewBox="0 0 1000 500"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Simplified world map paths */}
              <path
                d="M 150 200 Q 200 180 300 200 L 350 220 Q 400 200 500 210 L 600 200 Q 700 190 800 200 L 850 210 Q 900 200 950 220 L 950 300 Q 900 320 800 310 L 700 300 Q 600 310 500 300 L 400 310 Q 300 300 200 310 L 150 300 Z"
                fill="currentColor"
                className="text-muted-foreground/20"
              />
              <path
                d="M 100 150 Q 150 130 250 150 L 300 170 Q 350 150 450 160 L 500 150 Q 550 140 650 150 L 700 160 Q 750 150 850 170 L 850 250 Q 750 270 650 260 L 550 250 Q 450 260 350 250 L 250 260 Q 150 250 100 270 Z"
                fill="currentColor"
                className="text-muted-foreground/15"
              />
            </svg>
            
            {/* Country pins */}
            {mockCountryData.map((country, index) => {
              const x = (country.coordinates[0] + 180) / 360 * 1000;
              const y = (90 - country.coordinates[1]) / 180 * 500;
              const size = Math.max(8, Math.min(24, country.pratishthas / 5));
              
              return (
                <div
                  key={country.code}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  style={{ left: `${Math.max(5, Math.min(95, x / 10))}%`, top: `${Math.max(10, Math.min(90, y / 5))}%` }}
                >
                  <div
                    className="bg-primary rounded-full shadow-lg border-2 border-background transition-all duration-200 group-hover:scale-125"
                    style={{ width: size, height: size }}
                  />
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-background border border-border rounded-lg p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    <div className="font-medium">{country.country}</div>
                    <div className="text-xs text-muted-foreground">
                      Pratishthas: {country.pratishthas}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Padhramanis: {country.padhramanis}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full" />
              <span>Distribution Centers</span>
            </div>
          </div>
          <div className="text-xs">
            Total: {mockCountryData.reduce((sum, c) => sum + c.pratishthas, 0)} Pratishthas, {" "}
            {mockCountryData.reduce((sum, c) => sum + c.padhramanis, 0)} Padhramanis
          </div>
        </div>
      </CardContent>
    </Card>
  );
}