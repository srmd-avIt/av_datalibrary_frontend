import { X, MapPin, Calendar, Users, Clock, Phone, Mail, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { motion } from "motion/react";

interface DetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  type: string;
}

export function DetailsSidebar({ isOpen, onClose, data, type }: DetailsSidebarProps) {
  if (!isOpen || !data) return null;

  const renderContent = () => {
    switch (type) {
    
      case "event": // <-- ADD THIS NEW CASE
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">{data.EventName}</h3>
              <p className="text-muted-foreground">Event ID: {data.EventID}</p>
              <Badge className="mt-2">{data.NewEventCategory}</Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event Code</span>
                  <span className="font-medium">{data.EventCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Year</span>
                  <span className="font-medium">{data.Yr}</span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-muted-foreground">EventName</span>
                  <span className="font-medium">{data.EventName}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From Date</span>
                  <span className="font-medium">{data.FromDate || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To Date</span>
                  <span className="font-medium">{data.ToDate || 'N/A'}</span>
                </div>
                 <Separator />
                 <div>
                    <span className="text-muted-foreground">Remarks</span>
                    <p className="mt-1 text-sm bg-muted p-3 rounded-lg">{data.EventRemarks || "No remarks provided."}</p>
                  </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">LastModifiedBy</span>
                      <Badge variant="secondary">{data.LastModifiedBy}</Badge>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">LastModifiedTimestamp</span>
                      <Badge variant="secondary">{data.LastModifiedTimestamp}</Badge>
                  </div>
                  
              </CardContent>
            </Card>
          </div>
        );

      case "city":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">{data.name}</h3>
              <p className="text-muted-foreground">{data.country}</p>
              <Badge className="mt-2">{data.status}</Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">City Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Population</span>
                  <span className="font-medium">{data.population?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Satsang Hours</span>
                  <Badge variant="secondary">{data.satsangHours}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Attendees</span>
                  <span className="font-medium">{data.attendees?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coordinator</span>
                  <span className="font-medium">{data.coordinator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Event</span>
                  <span className="font-medium">{data.lastEvent}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "satsang":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">{data.topic}</h3>
              <p className="text-muted-foreground">{data.location}, {data.country}</p>
              <Badge className="mt-2">{data.type}</Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{data.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <Badge variant="secondary">{data.duration} hours</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Attendees</span>
                  <span className="font-medium">{data.attendees}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Speaker</span>
                  <span className="font-medium">{data.speaker}</span>
                </div>
                {data.notes && (
                  <div>
                    <span className="text-muted-foreground">Notes</span>
                    <p className="mt-1 text-sm bg-muted p-3 rounded-lg">{data.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "pratishtha":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">{data.name}</h3>
              <p className="text-muted-foreground">{data.location}, {data.country}</p>
              <Badge className="mt-2">{data.status}</Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pratishtha Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Established</span>
                  <span className="font-medium">{data.establishedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacity</span>
                  <Badge variant="secondary">{data.capacity}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weekly Events</span>
                  <span className="font-medium">{data.weeklyEvents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coordinator</span>
                  <span className="font-medium">{data.coordinator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contact</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{data.contact}</span>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Phone className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {data.facilities && (
                  <div>
                    <span className="text-muted-foreground">Facilities</span>
                    <p className="mt-1 text-sm bg-muted p-3 rounded-lg">{data.facilities}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "padhramani":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">{data.name}</h3>
              <p className="text-muted-foreground">{data.location}, {data.country}</p>
              <Badge className="mt-2">{data.status}</Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Padhramani Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Established</span>
                  <span className="font-medium">{data.establishedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacity</span>
                  <Badge variant="secondary">{data.capacity}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Events</span>
                  <span className="font-medium">{data.monthlyEvents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant="outline">{data.type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coordinator</span>
                  <span className="font-medium">{data.coordinator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contact</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{data.contact}</span>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Phone className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-96 bg-background border-l border-border shadow-2xl z-50"
    >
      {/* This flex container is the key. It sets up the layout. */}
      <div className="flex flex-col h-full">
        
        {/* 1. HEADER (Fixed Height) */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Details</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 2. SCROLLABLE CONTENT AREA */}
        {/* `flex-1` makes it take up all available space. */}
        {/* `overflow-y-auto` adds the scrollbar ONLY when needed. */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </div>

        {/* 3. FOOTER (Fixed Height) */}
        <div className="flex-shrink-0 p-4 border-t border-border">
          <div className="flex gap-2">
            <Button className="flex-1" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Full Details
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
      </div>
    </motion.div>
  );
}