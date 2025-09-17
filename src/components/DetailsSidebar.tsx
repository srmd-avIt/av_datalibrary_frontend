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
case "digitalrecording":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
                <FileAudio className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">{data.RecordingName || 'Digital Recording'}</h3>
              <p className="text-muted-foreground">Code: {data.RecordingCode}</p>
              <Badge className="mt-2">{data.QcStatus || 'N/A'}</Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recording Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event Code</span>
                  <span className="font-medium">{data.fkEventCode || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <Badge variant="secondary">{data.Duration || 'N/A'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File Size</span>
                  <span className="font-medium">{data.FilesizeInBytes ? `${(data.FilesizeInBytes / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-muted-foreground">Preservation</span>
                  <span className="font-medium">{data.PreservationStatus || 'N/A'}</span>
                </div>
                {data.DistributionDriveLink && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Link</span>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={data.DistributionDriveLink} target="_blank" rel="noopener noreferrer">
                        Open Link <ExternalLink className="w-3 h-3 ml-2" />
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Modified</span>
                      <span className="font-medium">{data.LastModifiedTimestamp || 'N/A'}</span>
                  </div>
              </CardContent>
            </Card>
          </div>
        );

      case "aux":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center justify-center">
                <File className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">{data.AuxTopic || 'Auxiliary File'}</h3>
              <p className="text-muted-foreground">ID: {data.new_auxid}</p>
              <Badge className="mt-2">{data.AuxFileType}</Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">File Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language</span>
                  <Badge variant="secondary">{data.AuxLanguage || 'N/A'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File Name</span>
                  <span className="font-medium truncate">{data.ProjFileName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File Size</span>
                  <span className="font-medium">{data.FilesizeBytes ? `${(data.FilesizeBytes / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</span>
                </div>
                <Separator />
                {data.GoogleDriveLink && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Google Drive</span>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={data.GoogleDriveLink} target="_blank" rel="noopener noreferrer">
                        Open Link <ExternalLink className="w-3 h-3 ml-2" />
                      </a>
                    </Button>
                  </div>
                )}
                {data.SRTLink && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">SRT Link</span>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={data.SRTLink} target="_blank" rel="noopener noreferrer">
                        Open Link <ExternalLink className="w-3 h-3 ml-2" />
                      </a>
                    </Button>
                  </div>
                )}
                {data.NotesRemarks && (
                  <div>
                    <span className="text-muted-foreground">Remarks</span>
                    <p className="mt-1 text-sm bg-muted p-3 rounded-lg">{data.NotesRemarks}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">Modified By</span>
                      <Badge variant="secondary">{data.ModifiedBy || 'N/A'}</Badge>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">Modified On</span>
                      <span className="font-medium">{data.ModifiedOn || 'N/A'}</span>
                  </div>
              </CardContent>
            </Card>
          </div>
        );

      case "medialog":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                <ListChecks className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">{data.Topic || 'Media Log'}</h3>
              <p className="text-muted-foreground">ID: {data.MLUniqueID}</p>
              <Badge className="mt-2">{data.EditingStatus || 'N/A'}</Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Log Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DR Code</span>
                  <span className="font-medium">{data.fkDigitalRecordingCode || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language</span>
                  <Badge variant="secondary">{data.Language || 'N/A'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{data.TotalDuration || 'N/A'}</span>
                </div>
                <Separator />
                {data.Synopsis && (
                  <div>
                    <span className="text-muted-foreground">Synopsis</span>
                    <p className="mt-1 text-sm bg-muted p-3 rounded-lg">{data.Synopsis}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Modified By</span>
                      <Badge variant="secondary">{data.LastModifiedBy || 'N/A'}</Badge>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Modified</span>
                      <span className="font-medium">{data.LastModifiedTimestamp || 'N/A'}</span>
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