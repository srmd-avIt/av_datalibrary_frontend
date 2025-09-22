"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { 
  X, ExternalLink, Mail, Calendar, FileAudio, ListChecks, 
  Loader2, AlertTriangle, ChevronRight,FileText
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { motion } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

type SidebarStackItem = {
  type: string;
  data: Record<string, any>;
  title: string;
};

interface DetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  type: string;
  title: string;
  onPushSidebar: (item: SidebarStackItem) => void;
  zIndex: number;
  positionOffset: number;
}

function DigitalRecordingsList({ eventCode, onPushSidebar }: { eventCode: string, onPushSidebar: (item: SidebarStackItem) => void }) {
  const [recordings, setRecordings] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/digitalrecording?fkEventCode=${encodeURIComponent(eventCode)}`);
        if (!response.ok) throw new Error(`Failed to fetch recordings (Status: ${response.status})`);
        const result = await response.json();
        setRecordings(result.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRecordings();
  }, [eventCode]);

  if (loading) return <div className="flex items-center justify-center p-4"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</div>;
  if (error) return <div className="text-destructive p-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>;
  if (!recordings || recordings.length === 0) return <div className="text-muted-foreground p-4 text-center">No recordings found.</div>;

  return (
    <div className="space-y-2">
      {recordings.map(rec => (
        <Card 
            key={rec.RecordingCode} 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onPushSidebar({
              type: 'digitalrecording',
              data: rec,
              title: 'Recording Details'
            })}
        >
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{rec.RecordingName}</p>
              <p className="text-xs text-muted-foreground">{rec.RecordingCode}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MediaLogsList({ recordingCode, onPushSidebar }: { recordingCode: string, onPushSidebar: (item: SidebarStackItem) => void }) {
  const [logs, setLogs] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

   useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/newmedialog?fkDigitalRecordingCode=${encodeURIComponent(recordingCode)}`);
        if (!response.ok) throw new Error(`Failed to fetch media logs (Status: ${response.status})`);
        const result = await response.json();
        setLogs(result.data);
      } catch (err: any)      {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [recordingCode]);

  if (loading) return <div className="flex items-center justify-center p-4"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</div>;
  if (error) return <div className="text-destructive p-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>;
  if (!logs || logs.length === 0) return <div className="text-muted-foreground p-4 text-center">No media logs found.</div>;

  return (
     <div className="space-y-2">
      {logs.map(log => (
        <Card 
            key={log.MLUniqueID} 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onPushSidebar({
              type: 'medialog',
              data: log,
              title: 'Media Log Details'
            })}
        >
           <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{log.Topic}</p>
              <p className="text-xs text-muted-foreground">{log.Detail || `ID: ${log.MLUniqueID}`}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DrilldownButton({ id, apiEndpoint, targetType, titlePrefix, onPushSidebar, children }: {
  id: string;
  apiEndpoint: string;
  targetType: string;
  titlePrefix: string;
  onPushSidebar: (item: SidebarStackItem) => void;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}${apiEndpoint}/${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error(`Failed to fetch (Status: ${response.status})`);
      const result = await response.json();
      
      if (!result || Object.keys(result).length === 0) {
        throw new Error('Item not found.');
      }
      
      onPushSidebar({
        type: targetType,
        data: result,
        title: `${titlePrefix} Details`
      });
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="link"
      className="p-0 h-auto font-medium text-base text-blue-400 hover:text-blue-300"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : error ? (
        <span className="text-destructive text-sm flex items-center gap-1">
          <AlertTriangle className="w-3 h-3"/> Error
        </span>
      ) : (
        <>
          {children}
          <ChevronRight className="w-4 h-4 ml-1" />
        </>
      )}
    </Button>
  );
}

export function DetailsSidebar({ isOpen, onClose, data, type, title, onPushSidebar, zIndex, positionOffset }: DetailsSidebarProps) {
  if (!isOpen || !data) return null;

  const renderContent = () => {
    switch (type) {
      case "event":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">{data.EventName}</h3>
              <p className="text-muted-foreground">Event ID: {data.EventID}</p>
              <Badge className="mt-2">{data.NewEventCategory || 'N/A'}</Badge>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-lg px-2">Event Details</CardTitle></CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Event Code</span>
                    <Button
                        variant="link"
                        className="p-0 h-auto font-medium text-base text-blue-400 hover:text-blue-300"
                        onClick={() => onPushSidebar({
                            type: 'digitalrecording_list',
                            data: { eventCode: data.EventCode },
                            title: `Recordings for ${data.EventCode}`
                        })}
                    >
                        {data.EventCode}
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Year</span>
                  <span className="font-medium">{data.Yr}</span>
                </div>
                 <div className="flex justify-between items-start gap-4">
                  <span className="text-muted-foreground flex-shrink-0">EventName</span>
                  <span className="font-medium text-right break-words">{data.EventName}</span>
                </div>
                <Separator/>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From Date</span>
                  <span className="font-medium">{new Date(data.FromDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To Date</span>
                  <span className="font-medium">{new Date(data.ToDate).toLocaleDateString()}</span>
                </div>
                 <Separator />
                 <div>
                    <span className="text-muted-foreground">Remarks</span>
                    <p className="mt-1 text-sm bg-muted p-3 rounded-lg">{data.EventRemarks || "No remarks provided."}</p>
                  </div>
              </CardContent>
            </Card>
             <Card className="w-full">
  <CardHeader>
    <CardTitle className="text-lg px-2">Metadata</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4 break-words">
    <div className="flex justify-between ">
      <span className="text-muted-foreground">LastModifiedBy</span>
      <Badge variant="secondary">{data.LastModifiedBy}</Badge>
    </div>
    <div className="flex justify-between ">
      <span className="text-muted-foreground">LastModifiedTimestamp</span>
      <Badge variant="secondary">{data.LastModifiedTimestamp}</Badge>
    </div>
  </CardContent>
</Card>

          </div>
        );

      case "digitalrecording_list":
        return (
            <Card>
                <CardHeader><CardTitle className="text-lg px-2">Refer for DigitalRecordings</CardTitle></CardHeader>
                <CardContent className="p-4">
                    <DigitalRecordingsList eventCode={data.eventCode} onPushSidebar={onPushSidebar} />
                </CardContent>
            </Card>
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
              <CardHeader><CardTitle className="text-lg px-2">Recording Details</CardTitle></CardHeader>
              <CardContent className="space-y-4 p-4">
                 <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Event Code</span>
                  {data.fkEventCode ? (
                    <DrilldownButton
                        id={data.fkEventCode}
                        apiEndpoint="/events" 
                        targetType="event"
                        titlePrefix="Event"
                        onPushSidebar={onPushSidebar}
                    >
                        {data.fkEventCode}
                    </DrilldownButton>
                  ) : (
                    <span className="font-medium">N/A</span>
                  )}
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">RecordingName</span>
                  <span className="font-medium">{data.RecordingName || 'N/A'}</span>
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
                <CardTitle className="text-lg px-2">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Modified</span>
                      <span className="font-medium">{data.LastModifiedTimestamp || 'N/A'}</span>
                  </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg px-2">Related Media Logs</CardTitle></CardHeader>
              <CardContent className="p-4">
                 <MediaLogsList recordingCode={data.RecordingCode} onPushSidebar={onPushSidebar} />
              </CardContent>
            </Card>
          </div>
        );
        
      case "medialog":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center justify-center">
                <ListChecks className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">{data.Topic || 'Media Log'}</h3>
              <p className="text-muted-foreground">ID: {data.MLUniqueID}</p>
              <Badge className="mt-2">{data.EditingStatus || 'N/A'}</Badge>
            </div>
           <Card>
              <CardHeader>
                <CardTitle className="text-lg px-2">Log Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Content From</span>
                  <span className="font-medium">{data.ContentFrom || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Content To</span>
                  <span className="font-medium">{data.ContentTo || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Recording Code</span>
                   {data.fkDigitalRecordingCode ? (
                    <DrilldownButton
                        id={data.fkDigitalRecordingCode}
                        apiEndpoint="/digitalrecordings"
                        targetType="digitalrecording"
                        titlePrefix="Recording"
                        onPushSidebar={onPushSidebar}
                    >
                        {data.fkDigitalRecordingCode}
                    </DrilldownButton>
                  ) : (
                    <Badge variant="secondary">N/A</Badge>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{data.TotalDuration || 'N/A'}</span>
                </div>
                <Separator />
                {data.Synopsis && (
                  <div>
                    <span className="text-muted-foreground">Content Detail</span>
                    <p className="mt-1 text-sm bg-muted p-3 rounded-lg">{data.Detail}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg px-2">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
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

      case "aux":    
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-green-500 to-red-600 flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">{data.AuxTopic || 'Auxiliary File'}</h3>
              <p className="text-muted-foreground">ID: {data.new_auxid}</p>
              <Badge className="mt-2">{data.AuxFileType}</Badge>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg px-2">File Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language</span>
                  <Badge variant="secondary">{data.AuxLanguage || 'N/A'}</Badge>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-muted-foreground flex-shrink-0">File Name</span>
                  <span className="font-medium text-right break-words">{data.ProjFileName || 'N/A'}</span>
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
                <CardTitle className="text-lg px-2">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
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

      default:
        return <div className="text-center p-4">Details view not implemented for type: "{type}"</div>;
    }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      style={{ zIndex, right: positionOffset }}
      // ✅ THE ONLY CHANGE IS HERE: "fixed" is changed to "absolute"
      className="absolute top-0 h-full w-96 bg-background border-l border-border shadow-2xl"
    >
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold truncate pr-4">{title}</h2>
         <Button
  size="icon"
  onClick={onClose}
  className="h-8 w-8 flex-shrink-0 !hover:bg-transparent !hover:text-current"
>
  <X className="w-4 h-4" />
</Button>

        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </div>
        <div className="flex-shrink-0 p-4 border-t border-border">
          <div className="flex gap-2">
            <Button className="flex-1" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Full Record
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