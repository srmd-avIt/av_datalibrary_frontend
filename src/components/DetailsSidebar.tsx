"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  X,
  ExternalLink,
  Mail,
  Calendar,
  FileAudio,
  ListChecks,
  Loader2,
  AlertTriangle,
  ChevronRight,
  FileText,
  Lock,
  BookOpen,
  Globe,
  Edit,
  Save,
  Users,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

// TypeScript fix for Vite's import.meta.env
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// @ts-ignore
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "";

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

function DigitalRecordingsList({
  eventCode,
  onPushSidebar,
}: {
  eventCode: string;
  onPushSidebar: (item: SidebarStackItem) => void;
}) {
  const [recordings, setRecordings] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/digitalrecording?fkEventCode=${encodeURIComponent(
            eventCode
          )}`
        );
        if (!response.ok)
          throw new Error(`Failed to fetch recordings (Status: ${response.status})`);
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

  if (loading)
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  if (error)
    return (
      <div className="text-destructive p-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        {error}
      </div>
    );
  if (!recordings || recordings.length === 0)
    return (
      <div className="text-muted-foreground p-4 text-center">
        No recordings found.
      </div>
    );

  return (
    <div className="space-y-2">
      {recordings.map((rec) => (
        <Card
          key={rec.RecordingCode}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() =>
            onPushSidebar({
              type: "digitalrecording",
              data: rec,
              title: "Recording Details",
            })
          }
        >
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{rec.RecordingName}</p>
              <p className="text-xs text-muted-foreground">
                {rec.RecordingCode}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MediaLogsList({
  recordingCode,
  onPushSidebar,
}: {
  recordingCode: string;
  onPushSidebar: (item: SidebarStackItem) => void;
}) {
  const [logs, setLogs] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/newmedialog?fkDigitalRecordingCode=${encodeURIComponent(
            recordingCode
          )}`
        );
        if (!response.ok)
          throw new Error(`Failed to fetch media logs (Status: ${response.status})`);
        const result = await response.json();
        setLogs(result.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [recordingCode]);

  if (loading)
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  if (error)
    return (
      <div className="text-destructive p-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        {error}
      </div>
    );
  if (!logs || logs.length === 0)
    return (
      <div className="text-muted-foreground p-4 text-center">
        No media logs found.
      </div>
    );

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <Card
          key={log.MLUniqueID}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() =>
            onPushSidebar({
              type: "medialog",
              data: log,
              title: "Media Log Details",
            })
          }
        >
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{log.Topic}</p>
              <p className="text-xs text-muted-foreground">
                {log.Detail || `ID: ${log.MLUniqueID}`}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DrilldownButton({
  id,
  apiEndpoint,
  targetType,
  titlePrefix,
  onPushSidebar,
  children,
}: {
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
      const response = await fetch(
        `${API_BASE_URL}${apiEndpoint}/${encodeURIComponent(id)}`
      );
      if (!response.ok) throw new Error(`Failed to fetch (Status: ${response.status})`);
      const result = await response.json();

      if (!result || Object.keys(result).length === 0) {
        throw new Error("Item not found.");
      }

      onPushSidebar({
        type: targetType,
        data: result,
        title: `${titlePrefix} Details`,
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
          <AlertTriangle className="w-3 h-3" /> Error
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

export function DetailsSidebar({
  isOpen,
  onClose,
  data,
  type,
  title,
  onPushSidebar,
  zIndex,
  positionOffset,
}: DetailsSidebarProps) {
  const { user } = useAuth();

  const hasAccess = useMemo(() => {
    return (resourceName: string, accessLevel: 'read' | 'write' = 'read'): boolean => {
      if (!user) return false;
      if (user.role === 'Admin' || user.role === 'Owner') return true;
      const permission = user.permissions.find((p) => p.resource === resourceName);
      if (!permission) return false;
      return permission.actions.includes(accessLevel);
    };
  }, [user]);

  const FieldRow = ({ label, value, children }: { label: string; value?: any; children?: React.ReactNode }) => {
    if (value === undefined || value === null) return null;
    if (typeof value === "string") {
      const v = value.trim();
      if (v === "" || v.toUpperCase() === "N/A") return null;
    }
    return (
      <div className="flex justify-between items-start gap-4">
        <span className="text-muted-foreground flex-shrink-0">{label}</span>
        <span className="font-medium text-right break-words">{children ?? value}</span>
      </div>
    );
  };
  
  if (!isOpen || !data) return null;
  
  const renderIcon = (icon: React.ReactNode, gradient: string) => (
    <div
      className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${gradient} flex items-center justify-center`}
    >
      {icon}
    </div>
  );
  
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
              <Badge className="mt-2">
                {data.NewEventCategory || "N/A"}
              </Badge>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg px-2">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Event Code</span>
                  {hasAccess("Digital Recordings", 'read') ? (
                    <Button
                      variant="link"
                      className="p-0 h-auto font-medium text-base text-blue-400 hover:text-blue-300"
                      onClick={() =>
                        onPushSidebar({
                          type: "digitalrecording_list",
                          data: { eventCode: data.EventCode },
                          title: `Recordings for ${data.EventCode}`,
                        })
                      }
                    >
                      {data.EventCode}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <span className="font-medium text-muted-foreground flex items-center gap-1 text-sm">
                      <Lock className="w-3 h-3"/> {data.EventCode}
                    </span>
                  )}
                </div>
                <FieldRow label="Year" value={data.Yr} />
                <FieldRow label="EventName" value={data.EventName}>
                  <span className="font-medium text-right break-words">{data.EventName}</span>
                </FieldRow>
                <Separator />
                <FieldRow
                  label="From Date"
                  value={data.FromDate}
                >
                  <span className="font-medium">{data.FromDate ? new Date(data.FromDate).toLocaleDateString() : undefined}</span>
                </FieldRow>
                <FieldRow
                  label="To Date"
                  value={data.ToDate}
                >
                  <span className="font-medium">{data.ToDate ? new Date(data.ToDate).toLocaleDateString() : undefined}</span>
                </FieldRow>
                <Separator />
                <div>
                  <span className="text-muted-foreground">Remarks</span>
                  <p className="mt-1 text-sm bg-muted p-3 rounded-lg">
                    {data.EventRemarks || "No remarks provided."}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-lg px-2">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 break-words">
                <FieldRow label="LastModifiedBy" value={data.LastModifiedBy}>
                   <Badge variant="secondary">{data.LastModifiedBy}</Badge>
                </FieldRow>
                 <FieldRow label="LastModifiedTimestamp" value={data.LastModifiedTimestamp}>
                   <Badge variant="secondary">{data.LastModifiedTimestamp}</Badge>
                </FieldRow>
              </CardContent>
            </Card>
          </div>
        );

      case "digitalrecording_list":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Refer for DigitalRecordings</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <DigitalRecordingsList eventCode={data.eventCode} onPushSidebar={onPushSidebar} />
            </CardContent>
          </Card>
        );

      case "medialog_list": {
        const renderListItem = (log: any) => {
          const cardProps = {
            key: log.MLUniqueID,
            className: "cursor-pointer hover:bg-muted/50 transition-colors",
            onClick: () =>
              onPushSidebar({
                type: "medialog",
                data: log,
                title: "Media Log Details",
              }),
          };

          let primaryText = log.Topic || log['Segment Category'] || `ID: ${log.MLUniqueID}`;
          let secondaryText = log.Detail || `ID: ${log.MLUniqueID}`;

          if (title.includes("Cities") || title.includes("Countries")) {
            primaryText = log.fkCity ? `${log.fkCity}, ${log.fkCountry}` : log.fkCountry;
            secondaryText = log.Topic || `ID: ${log.MLUniqueID}`;
          } else if (title.includes("Padhramnis")) {
            primaryText = log['Segment Category'];
            secondaryText = log.Topic || `ID: ${log.MLUniqueID}`;
          } else if (title.includes("Pratishthas")) {
            primaryText = log['Segment Category'];
            secondaryText = log.Topic || `ID: ${log.MLUniqueID}`;
          }

          return (
            <Card {...cardProps}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{primaryText}</p>
                  <p className="text-xs text-muted-foreground">{secondaryText}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          );
        };

        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {data.items.map((log: any) => renderListItem(log))}
              </div>
            </CardContent>
          </Card>
        );
      }

      case "digitalrecording":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
                <FileAudio className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">
                {data.RecordingName || "Digital Recording"}
              </h3>
              <p className="text-muted-foreground">Code: {data.RecordingCode}</p>
              <Badge className="mt-2">{data.QcStatus || "N/A"}</Badge>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg px-2">Recording Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Event Code</span>
                  {data.fkEventCode && hasAccess("Events", 'read') ? (
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
                     <span className="font-medium text-muted-foreground flex items-center gap-1 text-sm">
                       {data.fkEventCode ? <><Lock className="w-3 h-3"/> {data.fkEventCode}</> : 'N/A'}
                    </span>
                  )}
                </div>
                <FieldRow label="RecordingName" value={data.RecordingName} />
                <FieldRow label="Duration" value={data.Duration}>
                  <Badge variant="secondary">{data.Duration}</Badge>
                </FieldRow>
                <FieldRow
                  label="File Size"
                  value={data.FilesizeInBytes}
                >
                  <span className="font-medium">
                    {data.FilesizeInBytes ? `${(data.FilesizeInBytes / 1024 / 1024).toFixed(2)} MB` : undefined}
                  </span>
                </FieldRow>
                <FieldRow label="Preservation" value={data.PreservationStatus}>
                  <span className="font-medium">{data.PreservationStatus}</span>
                </FieldRow>
                {data.DistributionDriveLink && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Link</span>
                    <Button size="sm" variant="ghost" asChild>
                      <a
                        href={data.DistributionDriveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
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
                <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
              </CardContent>
            </Card>
            {hasAccess("Media Log") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg px-2">Related Media Logs</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {hasAccess("Media Log", 'read') ? (
                    <MediaLogsList recordingCode={data.RecordingCode} onPushSidebar={onPushSidebar} />
                  ) : (
                    <div className="text-muted-foreground p-4 text-center flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4"/> You don't have access to view Media Logs.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        );

        case "medialog": {
          // Helper to check if a value is present and not 'N/A'
          const hasValue = (value: any): boolean => {
            if (value === undefined || value === null) return false;
            if (typeof value === "string") {
              const v = value.trim();
              if (v === "" || v.toUpperCase() === "N/A") return false;
            }
            return true;
          };
  
          // Check if each card has any content to display
          const hasLogDetails = [data.EventName, data.ContentFrom, data.ContentTo, data.TimeOfDay, data.Detail, data.SubDetail, data.fkOccasion, data.TotalDuration].some(hasValue);
          const hasStatusDetails = [data.FootageType, data.EditingStatus, data['Segment Category'], data.Remarks, data.Guidance, data.IsInformal].some(hasValue);
          const hasTopicDetails = [data.fkGranth, data.NumberSource, data.Topic, data.Synopsis, data.Keywords, data.TopicGivenBy, data.SatsangStart, data.SatsangEnd, data.HasSubtitle, data.SubTitlesLanguage, data.IsDubbed, data.DubbedLanguage, data.DubbedArtist].some(hasValue);
          const hasLocationDetails = [data.Language, data.SpeakerSinger, data.fkOrganization, data.Designation, data.fkCountry, data.fkCity, data.fkState, data.Venue].some(hasValue);
          const hasMetadata = [data.EventCode, data.fkDigitalRecordingCode, data.MLUniqueID, data.FootageSrNo, data.LogSerialNo, data.CounterFrom, data.CounterTo, data.SubDuration, data.TotalDuration].some(hasValue);
          
          return (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center justify-center">
                  <ListChecks className="w-8 h-8 text-white" />
                </div>
              </div>
  
              {hasLogDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg px-2">Log Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4">
                    <FieldRow label="EventName" value={data.EventName} />
                    <FieldRow label="Content From" value={data.ContentFrom} />
                    <FieldRow label="Content To" value={data.ContentTo} />
                    <FieldRow label="Time Of Day" value={data.TimeOfDay} />
                   <FieldRow label=" Detail" value={data.Detail} />
                   <FieldRow label=" Sub Detail" value={data.SubDetail} />
                    <FieldRow label="Occasion" value={data.fkOccasion} />
                    <FieldRow label="Duration" value={data.TotalDuration} />
                  </CardContent>
                </Card>
              )}
  
              {hasStatusDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg px-2">Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4">
                    <FieldRow label="Footage Type" value={data.FootageType} />
                    <FieldRow label="Editing Status" value={data.EditingStatus} />
                    <FieldRow label="Segment Category" value={data['Segment Category']} />
                    <FieldRow label="Remarks" value={data.Remarks} />
                    <FieldRow label="Guidance" value={data.Guidance} />
                    <FieldRow label="IsInformal" value={data.IsInformal} />
                  </CardContent>
                </Card>
              )}
  
              {hasTopicDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg px-2">Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4">
                    <FieldRow label="Granth" value={data.fkGranth} />
                    <FieldRow label="Number" value={data.NumberSource} />
                    <FieldRow label="Topic" value={data.Topic} />
                    <FieldRow label="Synopsis" value={data.Synopsis} />
                    <FieldRow label="Keywords" value={data.Keywords} />
                    <FieldRow label="TopicGivenBy" value={data.TopicGivenBy} />
                    <FieldRow label="SatsangStart" value={data.SatsangStart} />
                    <FieldRow label="SatsangEnd" value={data.SatsangEnd} />
                    <FieldRow label="Has Subtitle" value={data.HasSubtitle} />
                    <FieldRow label="Subtitle Language" value={data.SubTitlesLanguage} />
                    <FieldRow label="IsDubbed" value={data.IsDubbed} />
                    <FieldRow label="Dubbed Language" value={data.DubbedLanguage} />
                    <FieldRow label="Dubbed Artist" value={data.DubbedArtist} />
                  </CardContent>
                </Card>
              )}
  
              {hasLocationDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg px-2">Locations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4">
                    <FieldRow label="Language" value={data.Language} />
                    <FieldRow label="Speaker" value={data.SpeakerSinger} />
                    <FieldRow label="Organization" value={data.fkOrganization} />
                    <FieldRow label="Designation" value={data.Designation} />
                    <FieldRow label="Country" value={data.fkCountry} />
                    <FieldRow label="City" value={data.fkCity} />
                    <FieldRow label="State" value={data.fkState} />
                    <FieldRow label="Venue" value={data.Venue} />
                  </CardContent>
                </Card>
              )}
  
              {hasMetadata && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg px-2">Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4">
                    {/* --- MODIFIED: EventCode is now a clickable drilldown button --- */}
                    {data.EventCode && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Event Code</span>
                        {hasAccess("Events", 'read') ? (
                          <DrilldownButton
                            id={data.EventCode}
                            apiEndpoint="/events"
                            targetType="event"
                            titlePrefix="Event"
                            onPushSidebar={onPushSidebar}
                          >
                            {data.EventCode}
                          </DrilldownButton>
                        ) : (
                          <span className="font-medium text-muted-foreground flex items-center gap-1 text-sm">
                            <Lock className="w-3 h-3"/> {data.EventCode}
                          </span>
                        )}
                      </div>
                    )}
                    {data.fkDigitalRecordingCode && (
                       <div className="flex justify-between items-center">
                         <span className="text-muted-foreground">Recording Code</span>
                         {hasAccess("Digital Recordings", 'read') ? (
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
                           <span className="font-medium text-muted-foreground flex items-center gap-1 text-sm">
                             <Lock className="w-3 h-3"/> {data.fkDigitalRecordingCode}
                           </span>
                         )}
                       </div>
                    )}
                    <FieldRow label="MLID" value={data.MLUniqueID} />
                    <FieldRow label="FootageSrNo" value={data.FootageSrNo} />
                    <FieldRow label="LogSerialNo" value={data.LogSerialNo} />
                    <FieldRow label="CounterFrom" value={data.CounterFrom} />
                    <FieldRow label="CounterTo" value={data.CounterTo} />
                    <FieldRow label="SubDuration" value={data.SubDuration} />
                    <FieldRow label="TotalDuration" value={data.TotalDuration} />
                  </CardContent>
                </Card>
              )}
            </div>
          );
        }

      case "aux": {
        const [isEditingSRT, setIsEditingSRT] = useState(false);
        const [srtLink, setSrtLink] = useState(data.SRTLink || "");
        const [isSaving, setIsSaving] = useState(false);

        const handleSaveSRTLink = async () => {
          setIsSaving(true);
          const savingToast = toast.loading("Saving SRT Link...");

          try {
            const response = await fetch(
              `${API_BASE_URL}/aux/${encodeURIComponent(data.new_auxid)}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ SRTLink: srtLink }),
              }
            );

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.message || "Failed to update SRT Link");
            }
            
            data.SRTLink = srtLink;

            toast.success("SRT Link updated successfully!", { id: savingToast });
            setIsEditingSRT(false);
          } catch (error: any) {
            toast.error(`Error: ${error.message}`, { id: savingToast });
            console.error("Error updating SRT Link:", error);
          } finally {
            setIsSaving(false);
          }
        };

        const handleCancel = () => {
          setIsEditingSRT(false);
          setSrtLink(data.SRTLink || "");
        };

        return (
          <div className="space-y-6">
            <div className="text-center">
              {renderIcon(<FileText className="w-8 h-8 text-white" />, "from-purple-500 to-red-600")}
              <h3 className="text-xl font-bold">{data.AuxTopic || "Auxiliary File"}</h3>
              <p className="text-muted-foreground">ID: {data.new_auxid}</p>
              <Badge className="mt-2">{data.AuxFileType}</Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg px-2">File Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-muted-foreground flex-shrink-0">fkMLID</span>
                   {data.fkMLID && hasAccess("Media Log") ? (
                    <DrilldownButton
                       id={data.fkMLID}
                       apiEndpoint="/newmedialog"
                       targetType="medialog"
                       titlePrefix="Media Log"
                       onPushSidebar={onPushSidebar}
                     >
                      {data.fkMLID}
                    </DrilldownButton>
                  ) : (
                    <span className="font-medium text-muted-foreground flex items-center gap-1 text-sm">
                      {data.fkMLID ? <><Lock className="w-3 h-3" /> {data.fkMLID}</> : "N/A"}
                    </span>
                  )}
                </div>
                <FieldRow label="Language" value={data.AuxLanguage}>
                  <Badge variant="secondary">{data.AuxLanguage}</Badge>
                </FieldRow>
                <FieldRow label="File Name" value={data.ProjFileName}>
                  <span className="font-medium text-right break-words">{data.ProjFileName}</span>
                </FieldRow>
                <FieldRow
                  label="File Size"
                  value={data.FilesizeBytes}
                >
                  <span className="font-medium">
                    {data.FilesizeBytes ? `${(data.FilesizeBytes / 1024 / 1024).toFixed(2)} MB` : undefined}
                  </span>
                </FieldRow>
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
                
                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground flex-shrink-0">SRT Link</span>
                  
                  {isEditingSRT ? (
                    <div className="flex items-center gap-2 w-full max-w-[220px]">
                      <Input
                        type="text"
                        value={srtLink}
                        onChange={(e) => setSrtLink(e.target.value)}
                        placeholder="Enter URL..."
                        className="h-8 text-sm"
                        disabled={isSaving}
                      />
                      <Button size="icon" className="h-8 w-8 flex-shrink-0" onClick={handleSaveSRTLink} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </Button>
                      <Button size="icon" variant="outline" className="h-8 w-8 flex-shrink-0" onClick={handleCancel} disabled={isSaving}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {srtLink ? (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={srtLink} target="_blank" rel="noopener noreferrer">
                            Open Link <ExternalLink className="w-3 h-3 ml-2" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not set</span>
                      )}
                      {hasAccess("Aux Files", 'write') && (
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setIsEditingSRT(true)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {data.NotesRemarks && (
                  <div>
                    <span className="text-muted-foreground">Remarks</span>
                    <p className="mt-1 text-sm bg-muted p-3 rounded-lg">{data.NotesRemarks}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg px-2">Metadata</CardTitle></CardHeader>
              <CardContent className="space-y-4 p-4">
                 <FieldRow label="Modified By" value={data.ModifiedBy}>
                   <Badge variant="secondary">{data.ModifiedBy}</Badge>
                 </FieldRow>
                 <FieldRow label="Modified On" value={data.ModifiedOn} />
              </CardContent>
            </Card>
          </div>
        );
      }
     case "audio": {
      const [isEditingAudioList, setIsEditingAudioList] = useState(false);
      const [audioList, setAudioList] = useState(data.AudioList || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveAudioList = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Audio List...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/audio/${encodeURIComponent(data.AID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ AudioList: audioList }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Audio List");
          }
    
          data.AudioList = audioList;
    
          toast.success("Audio List updated successfully!", { id: savingToast });
          setIsEditingAudioList(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Audio List:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingAudioList(false);
        setAudioList(data.AudioList || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<FileAudio className="w-8 h-8 text-white" />, "from-blue-500 to-purple-600")}
            <h3 className="text-xl font-bold">{data.AudioList || "Audio"}</h3>
            <p className="text-muted-foreground">Audio ID: {data.AID}</p>
            <Badge className="mt-2">{data.Distribution || "N/A"}</Badge>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Audio Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Audio List</span>
    
                {isEditingAudioList ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={audioList}
                      onChange={(e) => setAudioList(e.target.value)}
                      placeholder="Enter Audio List..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveAudioList}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {audioList ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {audioList}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Audio", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingAudioList(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }

    case "auxfiletype": {
      const [isEditingAuxFileType, setIsEditingAuxFileType] = useState(false);
      const [auxFileType, setAuxFileType] = useState(data.AuxFileType || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveAuxFileType = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Aux File Type...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/aux-file-type/${encodeURIComponent(data.AuxTypeID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ AuxFileType: auxFileType }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Aux File Type");
          }
    
          data.AuxFileType = auxFileType;
    
          toast.success("Aux File Type updated successfully!", { id: savingToast });
          setIsEditingAuxFileType(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Aux File Type:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingAuxFileType(false);
        setAuxFileType(data.AuxFileType || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<FileText className="w-8 h-8 text-white" />, "from-purple-500 to-pink-600")}
            <h3 className="text-xl font-bold">{data.AuxFileType || "Aux File Type"}</h3>
            <p className="text-muted-foreground">ID: {data.AuxTypeID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Aux File Type Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">File Type Name</span>
    
                {isEditingAuxFileType ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={auxFileType}
                      onChange={(e) => setAuxFileType(e.target.value)}
                      placeholder="Enter file type..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveAuxFileType}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {auxFileType ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {auxFileType}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Aux File Type", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingAuxFileType(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "bhajanType": {
      const [isEditingBhajanName, setIsEditingBhajanName] = useState(false);
      const [bhajanName, setBhajanName] = useState(data.BhajanName || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveBhajanName = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Bhajan Name...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/bhajantype/${encodeURIComponent(data.BTID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ BhajanName: bhajanName }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Bhajan Name");
          }
    
          data.BhajanName = bhajanName;
    
          toast.success("Bhajan Name updated successfully!", { id: savingToast });
          setIsEditingBhajanName(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Bhajan Name:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingBhajanName(false);
        setBhajanName(data.BhajanName || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<ListChecks className="w-8 h-8 text-white" />, "from-green-500 to-blue-600")}
            <h3 className="text-xl font-bold">{data.BhajanName || "Bhajan Type"}</h3>
            <p className="text-muted-foreground">BTID: {data.BTID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Bhajan Type Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Bhajan Name</span>
    
                {isEditingBhajanName ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={bhajanName}
                      onChange={(e) => setBhajanName(e.target.value)}
                      placeholder="Enter Bhajan Name..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveBhajanName}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {bhajanName ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {bhajanName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Bhajan Type", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingBhajanName(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "digitalMasterCategory": {
      const [isEditingDMCategoryName, setIsEditingDMCategoryName] = useState(false);
      const [dmCategoryName, setDMCategoryName] = useState(data.DMCategory_name || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveDMCategoryName = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving DM Category Name...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/digitalmastercategory/${encodeURIComponent(data.DMCID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ DMCategory_name: dmCategoryName }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update DM Category Name");
          }
    
          data.DMCategory_name = dmCategoryName;
    
          toast.success("DM Category Name updated successfully!", { id: savingToast });
          setIsEditingDMCategoryName(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating DM Category Name:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingDMCategoryName(false);
        setDMCategoryName(data.DMCategory_name || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<FileText className="w-8 h-8 text-white" />, "from-blue-500 to-red-600")}
            <h3 className="text-xl font-bold">{data.DMCategory_name || "Digital Master Category"}</h3>
            <p className="text-muted-foreground">DMCID: {data.DMCID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Digital Master Category Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">DM Category Name</span>
    
                {isEditingDMCategoryName ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={dmCategoryName}
                      onChange={(e) => setDMCategoryName(e.target.value)}
                      placeholder="Enter DM Category Name..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveDMCategoryName}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {dmCategoryName ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {dmCategoryName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Digital Master Category", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingDMCategoryName(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "distributionLabel": {
      const [isEditingLabelName, setIsEditingLabelName] = useState(false);
      const [labelName, setLabelName] = useState(data.LabelName || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveLabelName = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Label Name...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/distributionlabel/${encodeURIComponent(data.LabelID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ LabelName: labelName }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Label Name");
          }
    
          data.LabelName = labelName;
    
          toast.success("Label Name updated successfully!", { id: savingToast });
          setIsEditingLabelName(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Label Name:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingLabelName(false);
        setLabelName(data.LabelName || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Mail className="w-8 h-8 text-white" />, "from-teal-500 to-cyan-600")}
            <h3 className="text-xl font-bold">{data.LabelName || "Distribution Label"}</h3>
            <p className="text-muted-foreground">Label ID: {data.LabelID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Distribution Label Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Label Name</span>
    
                {isEditingLabelName ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={labelName}
                      onChange={(e) => setLabelName(e.target.value)}
                      placeholder="Enter Label Name..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveLabelName}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {labelName ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {labelName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Distribution Label", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingLabelName(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "editingType": {
      const [isEditingEdType, setIsEditingEdType] = useState(false);
      const [edType, setEdType] = useState(data.EdType || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveEdType = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Editing Type...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/editingtype/${encodeURIComponent(data.EdID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ EdType: edType }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Editing Type");
          }
    
          data.EdType = edType;
    
          toast.success("Editing Type updated successfully!", { id: savingToast });
          setIsEditingEdType(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Editing Type:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingEdType(false);
        setEdType(data.EdType || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Calendar className="w-8 h-8 text-white" />, "from-orange-500 to-blue-600")}
            <h3 className="text-xl font-bold">{data.EdType || "Editing Type"}</h3>
            <p className="text-muted-foreground">EdID: {data.EdID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Editing Type Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Editing Type</span>
    
                {isEditingEdType ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={edType}
                      onChange={(e) => setEdType(e.target.value)}
                      placeholder="Enter Editing Type..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveEdType}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {edType ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {edType}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Editing Type", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingEdType(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Audio/Video" value={data.AudioVideo} />
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "editingStatus": {
      const [isEditingEdType, setIsEditingEdType] = useState(false);
      const [edType, setEdType] = useState(data.EdType || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveEdType = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Editing Status...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/editingstatus/${encodeURIComponent(data.EdID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ EdType: edType }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Editing Status");
          }
    
          data.EdType = edType;
    
          toast.success("Editing Status updated successfully!", { id: savingToast });
          setIsEditingEdType(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Editing Status:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingEdType(false);
        setEdType(data.EdType || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Calendar className="w-8 h-8 text-white" />, "from-orange-500 to-blue-600")}
            <h3 className="text-xl font-bold">{data.EdType || "Editing Type"}</h3>
            <p className="text-muted-foreground">EdID: {data.EdID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Editing Status Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Editing Type</span>
    
                {isEditingEdType ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={edType}
                      onChange={(e) => setEdType(e.target.value)}
                      placeholder="Enter Editing Type..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveEdType}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {edType ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {edType}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Editing Type", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingEdType(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Audio/Video" value={data.AudioVideo} />
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "eventCategory": {
      const [isEditingEventCategory, setIsEditingEventCategory] = useState(false);
      const [eventCategory, setEventCategory] = useState(data.EventCategory || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveEventCategory = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Event Category...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/eventcategory/${encodeURIComponent(data.EventCategoryID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ EventCategory: eventCategory }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Event Category");
          }
    
          data.EventCategory = eventCategory;
    
          toast.success("Event Category updated successfully!", { id: savingToast });
          setIsEditingEventCategory(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Event Category:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingEventCategory(false);
        setEventCategory(data.EventCategory || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Calendar className="w-8 h-8 text-white" />, "from-blue-500 to-pink-600")}
            <h3 className="text-xl font-bold">{data.EventCategory || "Event Category"}</h3>
            <p className="text-muted-foreground">Event Category ID: {data.EventCategoryID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Event Category Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Event Category</span>
    
                {isEditingEventCategory ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={eventCategory}
                      onChange={(e) => setEventCategory(e.target.value)}
                      placeholder="Enter Event Category..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveEventCategory}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {eventCategory ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {eventCategory}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Event Category", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingEventCategory(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }

       case "highlight":
        return (
          <div className="space-y-6">
            <div className="text-center">
              {renderIcon(<FileAudio className="w-8 h-8 text-white" />, "from-purple-500 to-red-600")}
              <h3 className="text-xl font-bold">
                {data.RecordingName || "Edited Highlight"}
              </h3>
              
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg px-2">Highlight Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="flex justify-between items-start gap-3">
  <span className="text-sm text-muted-foreground whitespace-nowrap">
    EventName-Code
  </span>

  <div className="flex-1 text-right break-words overflow-hidden text-ellipsis">
    {data.EventCode && hasAccess("Events", 'read') ? (
      <DrilldownButton
        id={data.EventCode}
        apiEndpoint="/events"
        targetType="event"
        titlePrefix="Event"
        onPushSidebar={onPushSidebar}
      >
        <span className="break-words whitespace-normal">
          {data.EventName
            ? `${data.EventName} (${data.EventCode})`
            : data.EventCode}
        </span>
      </DrilldownButton>
    ) : (
      <span className="font-medium text-muted-foreground flex items-center gap-1 text-sm justify-end break-words whitespace-normal">
        {data.EventCode ? (
          <>
            <Lock className="w-3 h-3" /> {data.EventCode}
          </>
        ) : (
          "N/A"
        )}
      </span>
    )}
  </div>
</div>

                <FieldRow label="Recording Name" value={data.RecordingName} />
                <FieldRow label="Recording Code" value={data.RecordingCode} />
                <FieldRow label="Duration" value={data.Duration}>
                  <Badge variant="secondary">{data.Duration}</Badge>
                </FieldRow>
                <FieldRow label="Teams" value={data.Teams} />
                <Separator />
                <FieldRow label="From Date" value={data.FromDate ? new Date(data.FromDate).toLocaleDateString() : undefined} />
                <FieldRow label="To Date" value={data.ToDate ? new Date(data.ToDate).toLocaleDateString() : undefined} />
                <FieldRow label="Year" value={data.Yr} />
              </CardContent>
            </Card>
          </div>
        );

    case "footageType": {
      const [isEditingFootageType, setIsEditingFootageType] = useState(false);
      const [footageType, setFootageType] = useState(data.FootageTypeList || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveFootageType = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Footage Type...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/footagetype/${encodeURIComponent(data.FootageID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ FootageTypeList: footageType }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Footage Type");
          }
    
          data.FootageTypeList = footageType;
    
          toast.success("Footage Type updated successfully!", { id: savingToast });
          setIsEditingFootageType(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Footage Type:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingFootageType(false);
        setFootageType(data.FootageTypeList || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Calendar className="w-8 h-8 text-white" />, "from-orange-500 to-pink-600")}
            <h3 className="text-xl font-bold">{data.FootageTypeList || "Footage Type"}</h3>
            <p className="text-muted-foreground">Footage ID: {data.FootageID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Footage Type Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Footage Type</span>
    
                {isEditingFootageType ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={footageType}
                      onChange={(e) => setFootageType(e.target.value)}
                      placeholder="Enter Footage Type..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveFootageType}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {footageType ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {footageType}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Footage Type", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingFootageType(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "formatType": {
      const [isEditingType, setIsEditingType] = useState(false);
      const [type, setType] = useState(data.Type || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveType = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Format Type...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/formattype/${encodeURIComponent(data.FTID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ Type: type }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Format Type");
          }
    
          data.Type = type;
    
          toast.success("Format Type updated successfully!", { id: savingToast });
          setIsEditingType(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Format Type:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingType(false);
        setType(data.Type || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<FileText className="w-8 h-8 text-white" />, "from-green-500 to-red-600")}
            <h3 className="text-xl font-bold">{data.Type || "Format Type"}</h3>
            <p className="text-muted-foreground">FTID: {data.FTID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Format Type Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Format Type</span>
    
                {isEditingType ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      placeholder="Enter Format Type..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveType}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {type ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {type}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Format Type", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingType(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "granths": {
      const [isEditingName, setIsEditingName] = useState(false);
      const [name, setName] = useState(data.Name || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveName = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Granth Name...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/granths/${encodeURIComponent(data.ID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ Name: name }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Granth Name");
          }
    
          data.Name = name;
    
          toast.success("Granth Name updated successfully!", { id: savingToast });
          setIsEditingName(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Granth Name:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingName(false);
        setName(data.Name || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<BookOpen className="w-8 h-8 text-white" />, "from-purple-500 to-pink-600")}
            <h3 className="text-xl font-bold">{data.Name || "Granths"}</h3>
            <p className="text-muted-foreground">ID: {data.ID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Granths Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Name</span>
    
                {isEditingName ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter Granth Name..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveName}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {name ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {name}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Granths", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingName(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <FieldRow label="ID" value={data.ID} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "language": {
      const [isEditingTitleLanguage, setIsEditingTitleLanguage] = useState(false);
      const [titleLanguage, setTitleLanguage] = useState(data.TitleLanguage || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveTitleLanguage = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Title Language...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/language/${encodeURIComponent(data.STID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ TitleLanguage: titleLanguage }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Title Language");
          }
    
          data.TitleLanguage = titleLanguage;
    
          toast.success("Title Language updated successfully!", { id: savingToast });
          setIsEditingTitleLanguage(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Title Language:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingTitleLanguage(false);
        setTitleLanguage(data.TitleLanguage || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Globe className="w-8 h-8 text-white" />, "from-green-500 to-red-600")}
            <h3 className="text-xl font-bold">{data.TitleLanguage || "Language"}</h3>
            <p className="text-muted-foreground">STID: {data.STID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Language Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Title Language</span>
    
                {isEditingTitleLanguage ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={titleLanguage}
                      onChange={(e) => setTitleLanguage(e.target.value)}
                      placeholder="Enter Title Language..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveTitleLanguage}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {titleLanguage ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {titleLanguage}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Language", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingTitleLanguage(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="STID" value={data.STID} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "masterquality": {
      const [isEditingMQName, setIsEditingMQName] = useState(false);
      const [mqName, setMQName] = useState(data.MQName || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveMQName = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Master Quality...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/master-quality/${encodeURIComponent(data.MQID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ MQName: mqName }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Master Quality");
          }
    
          data.MQName = mqName;
    
          toast.success("Master Quality updated successfully!", { id: savingToast });
          setIsEditingMQName(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Master Quality:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingMQName(false);
        setMQName(data.MQName || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<ListChecks className="w-8 h-8 text-white" />, "from-green-500 to-red-600")}
            <h3 className="text-xl font-bold">{data.MQName || "Master Quality"}</h3>
            <p className="text-muted-foreground">MQID: {data.MQID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Master Quality Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Quality Name</span>
    
                {isEditingMQName ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={mqName}
                      onChange={(e) => setMQName(e.target.value)}
                      placeholder="Enter Quality Name..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveMQName}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {mqName ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {mqName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Master Quality", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingMQName(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "newEventCategory": {
      const [isEditingNewEventCategoryName, setIsEditingNewEventCategoryName] = useState(false);
      const [newEventCategoryName, setNewEventCategoryName] = useState(data.NewEventCategoryName || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveNewEventCategoryName = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Event Category Name...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/neweventcategory/${encodeURIComponent(data.CategoryID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ NewEventCategoryName: newEventCategoryName }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Event Category Name");
          }
    
          data.NewEventCategoryName = newEventCategoryName;
    
          toast.success("Event Category Name updated successfully!", { id: savingToast });
          setIsEditingNewEventCategoryName(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Event Category Name:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingNewEventCategoryName(false);
        setNewEventCategoryName(data.NewEventCategoryName || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<FileText className="w-8 h-8 text-white" />, "from-orange-500 to-purple-600")}
            <h3 className="text-xl font-bold">{data.NewEventCategoryName || "New Event Category"}</h3>
            <p className="text-muted-foreground">Category ID: {data.CategoryID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">New Event Category Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Event Category Name</span>
    
                {isEditingNewEventCategoryName ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={newEventCategoryName}
                      onChange={(e) => setNewEventCategoryName(e.target.value)}
                      placeholder="Enter Event Category Name..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveNewEventCategoryName}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {newEventCategoryName ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {newEventCategoryName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("New Event Category", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingNewEventCategoryName(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
              <FieldRow label="MARKDISCARD" value={data.MARK_DISCARD} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "newCities": {
      const [isEditingCity, setIsEditingCity] = useState(false);
      const [city, setCity] = useState(data.City || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveCity = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving City...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/newcities/${encodeURIComponent(data.CityID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ City: city }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update City");
          }
    
          data.City = city;
    
          toast.success("City updated successfully!", { id: savingToast });
          setIsEditingCity(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating City:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingCity(false);
        setCity(data.City || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Globe className="w-8 h-8 text-white" />, "from-orange-500 to-pink-600")}
            <h3 className="text-xl font-bold">{data.City || "New Cities"}</h3>
            <p className="text-muted-foreground">City ID: {data.CityID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">New Cities Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">City</span>
    
                {isEditingCity ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Enter City..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveCity}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {city ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {city}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("New Cities", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingCity(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "newCountries": {
      const [isEditingCountry, setIsEditingCountry] = useState(false);
      const [country, setCountry] = useState(data.Country || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveCountry = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Country...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/newcountries/${encodeURIComponent(data.CountryID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ Country: country }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Country");
          }
    
          data.Country = country;
    
          toast.success("Country updated successfully!", { id: savingToast });
          setIsEditingCountry(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Country:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingCountry(false);
        setCountry(data.Country || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Globe className="w-8 h-8 text-white" />, "from-green-500 to-purple-600")}
            <h3 className="text-xl font-bold">{data.Country || "New Countries"}</h3>
            <p className="text-muted-foreground">Country ID: {data.CountryID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">New Countries Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Country</span>
    
                {isEditingCountry ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Enter Country..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveCountry}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {country ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {country}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("New Countries", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingCountry(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "newStates": {
      const [isEditingState, setIsEditingState] = useState(false);
      const [state, setState] = useState(data.State || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveState = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving State...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/newstates/${encodeURIComponent(data.StateID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ State: state }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update State");
          }
    
          data.State = state;
    
          toast.success("State updated successfully!", { id: savingToast });
          setIsEditingState(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating State:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingState(false);
        setState(data.State || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Globe className="w-8 h-8 text-white" />, "from-purple-500 to-pink-600")}
            <h3 className="text-xl font-bold">{data.State || "New States"}</h3>
            <p className="text-muted-foreground">State ID: {data.StateID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">New States Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">State</span>
    
                {isEditingState ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Enter State..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveState}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {state ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {state}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("New States", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingState(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "organization": {
      const [isEditingOrg, setIsEditingOrg] = useState(false);
      const [organization, setOrganization] = useState(data.Organization || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveOrganization = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Organization...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/organizations/${encodeURIComponent(data.OrganizationID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ Organization: organization }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Organization");
          }
    
          data.Organization = organization;
    
          toast.success("Organization updated successfully!", { id: savingToast });
          setIsEditingOrg(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Organization:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingOrg(false);
        setOrganization(data.Organization || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Users className="w-8 h-8 text-white" />, "from-green-500 to-purple-600")}
            <h3 className="text-xl font-bold">{data.Organization || "Organization"}</h3>
            <p className="text-muted-foreground">ID: {data.OrganizationID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Organization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Organization Name</span>
    
                {isEditingOrg ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Enter Organization Name..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveOrganization}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {organization ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {organization}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Organizations", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingOrg(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "occasions": {
      const [isEditingOccasion, setIsEditingOccasion] = useState(false);
      const [occasion, setOccasion] = useState(data.Occasion || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveOccasion = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Occasion...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/occasions/${encodeURIComponent(data.OccasionID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ Occasion: occasion }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Occasion");
          }
    
          data.Occasion = occasion;
    
          toast.success("Occasion updated successfully!", { id: savingToast });
          setIsEditingOccasion(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Occasion:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingOccasion(false);
        setOccasion(data.Occasion || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<FileText className="w-8 h-8 text-white" />, "from-purple-500 to-red-600")}
            <h3 className="text-xl font-bold">{data.Occasion || "Occasions"}</h3>
            <p className="text-muted-foreground">Occasion ID: {data.OccasionID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Occasions Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Occasion</span>
    
                {isEditingOccasion ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      placeholder="Enter Occasion..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveOccasion}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {occasion ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {occasion}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Occasions", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingOccasion(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "topicNumberSource": {
      const [isEditingTNName, setIsEditingTNName] = useState(false);
      const [tnName, setTNName] = useState(data.TNName || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveTNName = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Topic Name...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/topicnumbersource/${encodeURIComponent(data.TNID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ TNName: tnName }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Topic Name");
          }
    
          data.TNName = tnName;
    
          toast.success("Topic Name updated successfully!", { id: savingToast });
          setIsEditingTNName(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Topic Name:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingTNName(false);
        setTNName(data.TNName || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<FileText className="w-8 h-8 text-white" />, "from-teal-500 to-blue-600")}
            <h3 className="text-xl font-bold">{data.TNName || "Topic Number Source"}</h3>
            <p className="text-muted-foreground">Topic ID: {data.TNID}</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Topic Number Source Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Topic Name</span>
    
                {isEditingTNName ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={tnName}
                      onChange={(e) => setTNName(e.target.value)}
                      placeholder="Enter Topic Name..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveTNName}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {tnName ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {tnName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Topic Number Source", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingTNName(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
    
              <FieldRow label="Last Modified" value={data.LastModifiedTimestamp} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "timeOfDay": {
      const [isEditingTimeList, setIsEditingTimeList] = useState(false);
      const [timeList, setTimeList] = useState(data.TimeList || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveTimeList = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Time of Day...");
    
        try {
          const response = await fetch(
            `${API_BASE_URL}/time-of-day/${encodeURIComponent(data.TimeID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ TimeList: timeList }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Time of Day");
          }
    
          data.TimeList = timeList;
    
          toast.success("Time of Day updated successfully!", { id: savingToast });
          setIsEditingTimeList(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Time of Day:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingTimeList(false);
        setTimeList(data.TimeList || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Calendar className="w-8 h-8 text-white" />, "from-green-500 to-purple-600")}
            <h3 className="text-xl font-bold">{data.TimeList || "Time of Day"}</h3>
            <p className="text-muted-foreground">Time ID: {data.TimeID}</p>
          </div>
    
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Time of Day Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Time List</span>
    
                {isEditingTimeList ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={timeList}
                      onChange={(e) => setTimeList(e.target.value)}
                      placeholder="Enter Time List..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveTimeList}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {timeList ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {timeList}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Time of Day", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingTimeList(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    case "topicgivenby": {
      const [isEditingTGBName, setIsEditingTGBName] = useState(false);
      const [tgbName, setTGBName] = useState(data.TGB_Name || "");
      const [isSaving, setIsSaving] = useState(false);
    
      const handleSaveTGBName = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Topic Given By...");
        try {
          const response = await fetch(
            `${API_BASE_URL}/topic-given-by/${encodeURIComponent(data.TGBID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ TGB_Name: tgbName }),
            }
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Topic Given By");
          }
          data.TGB_Name = tgbName;
          toast.success("Topic Given By updated successfully!", { id: savingToast });
          setIsEditingTGBName(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Topic Given By:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingTGBName(false);
        setTGBName(data.TGB_Name || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<Users className="w-8 h-8 text-white" />, "from-blue-500 to-purple-600")}
            <h3 className="text-xl font-bold">{data.TGB_Name || "Topic Given By"}</h3>
            <p className="text-muted-foreground">TGBID: {data.TGBID}</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Topic Given By Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Name</span>
                {isEditingTGBName ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={tgbName}
                      onChange={(e) => setTGBName(e.target.value)}
                      placeholder="Enter Name..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveTGBName}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {tgbName ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {tgbName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Topic Given By", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingTGBName(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <FieldRow label="Last Modified By" value={data.LastModifiedBy} />
              <FieldRow label="Last Modified" value={data.LastModifiedTs} />
            </CardContent>
          </Card>
        </div>
      );
    }
    case "segmentcategory": {
      const [isEditingSegCatName, setIsEditingSegCatName] = React.useState(false);
      const [segCatName, setSegCatName] = React.useState(data.SegCatName || "");
      const [isSaving, setIsSaving] = React.useState(false);
    
      const handleSaveSegCatName = async () => {
        setIsSaving(true);
        const savingToast = toast.loading("Saving Segment Category...");
        try {
          const response = await fetch(
            `${API_BASE_URL}/segment-category/${encodeURIComponent(data.SegCatID)}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ SegCatName: segCatName }),
            }
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update Segment Category");
          }
          data.SegCatName = segCatName;
          toast.success("Segment Category updated successfully!", { id: savingToast });
          setIsEditingSegCatName(false);
        } catch (error: any) {
          toast.error(`Error: ${error.message}`, { id: savingToast });
          console.error("Error updating Segment Category:", error);
        } finally {
          setIsSaving(false);
        }
      };
    
      const handleCancel = () => {
        setIsEditingSegCatName(false);
        setSegCatName(data.SegCatName || "");
      };
    
      return (
        <div className="space-y-6">
          <div className="text-center">
            {renderIcon(<ListChecks className="w-8 h-8 text-white" />, "from-blue-500 to-purple-600")}
            <h3 className="text-xl font-bold">{data.SegCatName || "Segment Category"}</h3>
            <p className="text-muted-foreground">SegCatID: {data.SegCatID}</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg px-2">Segment Category Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground flex-shrink-0">Name</span>
                {isEditingSegCatName ? (
                  <div className="flex items-center gap-2 w-full max-w-[220px]">
                    <Input
                      type="text"
                      value={segCatName}
                      onChange={(e) => setSegCatName(e.target.value)}
                      placeholder="Enter Name..."
                      className="h-8 text-sm"
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveSegCatName}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {segCatName ? (
                      <span className="font-medium text-right break-words max-w-[180px]">
                        {segCatName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                    {hasAccess("Segment Category", 'write') && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => setIsEditingSegCatName(true)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <FieldRow label="Last Modified By" value={data.LastModifiedBy} />
              <FieldRow label="Last Modified" value={data.LastModifiedTs} />
            </CardContent>
          </Card>
        </div>
      );
    }
      default:
        return (
          <div className="text-center p-4">
            Details view not implemented for type: "{type}"
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      style={{ zIndex, right: positionOffset }}
      className="fixed top-0 h-full w-96 bg-background border-l border-border shadow-2xl"
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
        <div className="flex-1 p-6 overflow-y-auto">{renderContent()}</div>
      </div>
    </motion.div>
  );
}
