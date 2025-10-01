import { StatsCard } from "./StatsCard";
import { WorldMap } from "./WorldMap";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts";
import { Map, Users, Clock, FileText, Database, TrendingUp } from "lucide-react";

const yearlyData = [
  { year: "2020", hours: 2400 },
  { year: "2021", hours: 3200 },
  { year: "2022", hours: 4100 },
  { year: "2023", hours: 5800 },
  { year: "2024", hours: 6500 },
];

const countryHours = [
  { country: "India", hours: 3200 },
  { country: "USA", hours: 1800 },
  { country: "UK", hours: 950 },
  { country: "Canada", hours: 720 },
  { country: "Australia", hours: 580 },
  { country: "Germany", hours: 450 },
];

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of global activities and statistics</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Countries Visited"
          value={47}
          subtitle="Across 6 continents"
          icon={Map}
          trend={{ value: 12, label: "from last year" }}
        />
        <StatsCard
          title="Cities Visited"
          value={312}
          subtitle="Major metropolitan areas"
          icon={Users}
          trend={{ value: 18, label: "from last year" }}
        />
        <StatsCard
          title="Total Satsang Hours"
          value={6500}
          subtitle="This year"
          icon={Clock}
          trend={{ value: 15, label: "from last year" }}
        />
        <StatsCard
          title="Active Centers"
          value={247}
          subtitle="Pratishthas + Padhramanis"
          icon={Database}
          trend={{ value: 8, label: "from last month" }}
        />
      </div>

      {/* Charts and Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WorldMap />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Yearly Satsang Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                hours: {
                  label: "Hours",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearlyData}>
                  <XAxis dataKey="year" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-1))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Country Hours Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Satsang Hours by Country</CardTitle>
          <p className="text-sm text-muted-foreground">
            Distribution of spiritual gathering hours across major regions
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              hours: {
                label: "Hours",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-80"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryHours}>
                <XAxis dataKey="country" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="hours" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
} 