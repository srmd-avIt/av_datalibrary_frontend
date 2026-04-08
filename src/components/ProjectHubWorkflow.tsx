/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Save, Plus, Layers, FileAudio, FileText, Trash2, CheckCircle2, FolderOpen, Loader2, Search, MessageSquare, Edit, Database, UserX, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import mediaInfoFactory from 'mediainfo.js';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from "../components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";

// --- HELPERS ---
const generateCode = (prefix: string, length: number) => {
  return `${prefix}${Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0')}`;
};

const parseTimeToSeconds = (timeStr: string) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
};

const formatSecondsToTime = (seconds: number) => {
  if (seconds < 0 || isNaN(seconds)) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => v < 10 ? "0" + v : v).join(":");
};

const formatBytes = (bytes: number, decimals = 2): string => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(dm)} ${sizes[i]}`;
};

// --- PYTHON PORTED LOGIC ---
const extractDigitalCode = (name: string): string => {
  if (!name) return "";
  const pattern = /\b(E0\d{5}_(?:[A-GHIJKMNP0-9WX]\d{2}|\d{3})|E0\d{4}_[A-GHIJKMNP0-9WX]\d{2}|E0\d{4}_\d{3}|E\d{6}(?:_\d+)?|\d{3}_\d{4}_\d{2})\b/i;
  const match = name.match(pattern);
  if (match) {
    let captured = match[1];
    if (captured.charAt(0).toUpperCase() === 'E') return captured.toUpperCase();
    return captured;
  }
  return "";
};

const bucketVideoBitrate = (mbps: number): string => {
  if (mbps == null || mbps < 0 || isNaN(mbps)) return "";
  if (mbps <= 6.0) return "2";
  if (mbps <= 16.0) return "10";
  if (mbps <= 30.0) return "25";
  if (mbps <= 40.0) return "35";
  if (mbps <= 60.0) return "50";
  if (mbps <= 70.0) return "65";
  if (mbps <= 90.0) return "85";
  if (mbps <= 110.0) return "100";
  return Math.round(mbps).toString();
};

const bucketAudioBitrate = (kbps: number): string => {
  if (kbps == null || kbps < 0 || isNaN(kbps)) return "";
  if (kbps <= 80) return "64";
  if (kbps <= 112) return "96";
  if (kbps <= 144) return "128";
  if (kbps <= 176) return "160";
  if (kbps <= 208) return "192";
  if (kbps <= 240) return "224";
  if (kbps <= 288) return "256";
  if (kbps <= 320) return "320";
  return Math.round(kbps).toString();
};

const determineMasterQuality = (name: string, isPhoto: boolean): string => {
  const fn = name.toUpperCase();
  // Check for Photos first (isPhoto boolean or starts with P)
  if (isPhoto || fn.startsWith('P') || fn.includes('_P')) return "Photos";
  
  // Pattern matching for Video and Audio
  if (fn.includes("_0") || fn.includes("_1") || fn.includes("_9")) return "Video - High Res";
  if (fn.includes("_A") || fn.includes("_B") || fn.includes("_C") || fn.includes("_D") || fn.includes("_E") || fn.includes("_F") || fn.includes("_G")) return "Video - Low Res";
  if (fn.includes("_M") || fn.includes("_N")) return "Audio - Low Res";
  if (fn.includes("_W") || fn.includes("_X")) return "Audio - High Res";
  if (fn.includes("_H") || fn.includes("_I") || fn.includes("_J") || fn.includes("_K")) return "Project File";
  
  return " "; // Default fallback
};

// --- HARDENED NATIVE HTML5 EXTRACTOR ---
const getMediaMetadataHTML5 = (file: File, isVideo: boolean): Promise<number> => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const media = document.createElement(isVideo ? 'video' : 'audio');
    
    const cleanup = () => {
      media.onloadedmetadata = null;
      media.onerror = null;
      URL.revokeObjectURL(url);
      media.remove();
    };

    const timeout = setTimeout(() => {
      cleanup();
      resolve(0);
    }, 5000);

    media.onloadedmetadata = () => {
      clearTimeout(timeout);
      const dur = media.duration;
      cleanup();
      resolve(dur && !isNaN(dur) && dur !== Infinity ? dur : 0);
    };

    media.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      resolve(0);
    };

    media.preload = "metadata";
    media.src = url;
  });
};

// --- METADATA EXTRACTOR ---
const extractMediaMetadata = async (file: File, isVideo: boolean, isAudio: boolean): Promise<{ duration: string, vBitrate: string, aBitrate: string }> => {
  if (!isVideo && !isAudio) return { duration: "", vBitrate: "", aBitrate: "" };

  let durationSec = 0, rawVBitrate = 0, rawABitrate = 0, overallBitrate = 0;

  try {
    const mediainfo = await mediaInfoFactory({ format: 'object' });
    const getSize = () => file.size;
    const readChunk = async (chunkSize: number, offset: number) => {
      const buffer = await file.slice(offset, offset + chunkSize).arrayBuffer();
      return new Uint8Array(buffer);
    };

    const info: any = await mediainfo.analyzeData(getSize, readChunk);
    mediainfo.close(); 

    if (info && info.media && info.media.track) {
      const tracks = Array.isArray(info.media.track) ? info.media.track : [info.media.track];
      const generalTrack = tracks.find((t: any) => t['@type'] === 'General');
      const videoTrack = tracks.find((t: any) => t['@type'] === 'Video');
      const audioTrack = tracks.find((t: any) => t['@type'] === 'Audio');

      if (generalTrack?.Duration) durationSec = parseFloat(generalTrack.Duration);
      if (generalTrack?.OverallBitRate) overallBitrate = parseFloat(generalTrack.OverallBitRate);
      
      if (videoTrack) rawVBitrate = parseFloat(videoTrack.BitRate || videoTrack.BitRate_Nominal || videoTrack.BitRate_Maximum || "0");
      if (audioTrack) rawABitrate = parseFloat(audioTrack.BitRate || audioTrack.BitRate_Nominal || audioTrack.BitRate_Maximum || "0");
    }
  } catch (error) {
    console.warn(`MediaInfo warning on ${file.name}, using HTML5 fallback...`);
  }

  if (!durationSec) durationSec = await getMediaMetadataHTML5(file, isVideo);

  if (durationSec > 0) {
    let calcOverall = (file.size * 8) / durationSec;
    if (!overallBitrate) overallBitrate = calcOverall;
    if (isVideo && !rawVBitrate) rawVBitrate = overallBitrate; 
    if (isAudio && !rawABitrate) rawABitrate = overallBitrate;
  }

  const durationStr = durationSec > 0 ? formatSecondsToTime(durationSec) : "";
  let vBitrateStr = "", aBitrateStr = "";

  if (isVideo) {
    if (rawVBitrate > 0) {
      const bucketed = bucketVideoBitrate(rawVBitrate / 1000000);
      if (bucketed) vBitrateStr = `${bucketed} Mbps`;
    }
    aBitrateStr = ""; 
  } 
  else if (isAudio) {
    if (rawABitrate > 0) {
      const bucketed = bucketAudioBitrate(Math.floor(rawABitrate / 1000));
      if (bucketed) aBitrateStr = `${bucketed} kbps`;
    }
    vBitrateStr = ""; 
  }

  return { duration: durationStr, vBitrate: vBitrateStr, aBitrate: aBitrateStr };
};

// ==========================================
// EXCEL SMART AUTO-FILL NUMBER ENGINE
// ==========================================
const calculateSmartFillValue = (startValue: string, step: number, shouldIncrement: boolean) => {
  if (!startValue || !shouldIncrement) return startValue;
  const match = String(startValue).match(/^(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const numStr = match[2];
    const newNum = parseInt(numStr, 10) + step;
    if (newNum < 0) return startValue; 
    return `${prefix}${String(newNum).padStart(numStr.length, '0')}`;
  }
  return startValue;
};

// ==========================================
// AUTO-CALCULATION ENGINE (ML IDs & SERIALS)
// ==========================================
const recalculateMLSerials = (rows: any[], currentEventCode: string) => {
  const dmCodeCounts: Record<string, number> = {};
  return rows.map((row, idx) => {
    const eventCode = currentEventCode || row.eventCode;
    
    if (!row.dmCode) return { ...row, eventCode, logSrNo: "", mlUniqueId: "", footageSrNo: (idx + 1).toString() }; 

    dmCodeCounts[row.dmCode] = (dmCodeCounts[row.dmCode] || 0) + 1;
    const serialNum = dmCodeCounts[row.dmCode];
    
    // CHANGE THIS LINE: Remove padStart to get 1, 2, 3 instead of 001, 002, 003
    const logSerialFormatted = String(serialNum); 
    
    const mlUniqueId = `${row.dmCode}.${logSerialFormatted}`;
    
    return {
      ...row,
      footageSrNo: (idx + 1).toString(),
      eventCode: eventCode,
      logSrNo: logSerialFormatted,
      mlUniqueId: mlUniqueId
    };
  });
};

// ==========================================
// DURATION CALCULATION HELPER
// ==========================================
const calculateDuration = (counterFrom: string, counterTo: string): string => {
  if (!counterFrom || !counterTo) return "";
  const fromSec = parseTimeToSeconds(counterFrom);
  const toSec = parseTimeToSeconds(counterTo);
  if (toSec < fromSec) return "Invalid";
  if (toSec === fromSec) return "00:00:00";
  return formatSecondsToTime(toSec - fromSec);
};

// --- CONTENT CODE TYPES ---
const CONTENT_CODE_TYPES = [
  { 
    label: "Full Pravachan Dubbed (700 Series)", 
    value: "FULL_PRAVACHAN", 
    range: "700-799 / 800+",
    prefix: "700",
    startNum: 700,
    endNum: 799,
    nextPrefix: "800"
  },
  { 
    label: "Satsang clips / Wisdom capsules (400-699 Series)", 
    value: "SATSANG_CLIPS", 
    range: "400-699 / 800+",
    prefix: "400",
    startNum: 400,
    endNum: 699,
    nextPrefix: "800"
  },
  { 
    label: "Edited Videos (200 Series)", 
    value: "EDITED_VIDEOS", 
    range: "200-299",
    prefix: "200",
    startNum: 200,
    endNum: 299
  },
  { 
    label: "Promos (300 Series)", 
    value: "PROMOS", 
    range: "300-399",
    prefix: "300",
    startNum: 300,
    endNum: 399
  },
  { 
    label: "Semi / Unedited (001-199 Series)", 
    value: "SEMI_UNEDITED", 
    range: "001-199 / 900+",
    prefix: "001",
    startNum: 1,
    endNum: 199,
    nextPrefix: "900"
  },
  { 
    label: "Low Res (A01 - E99 Series)", 
    value: "LOW_RES", 
    range: "A01-E99",
    prefix: "A",
    alphaRange: true
  },
  { 
    label: "Audio MP3 (M01 - O99 Series)", 
    value: "AUDIO_MP3", 
    range: "M01-O99",
    prefix: "M",
    alphaRange: true
  },
  { 
    label: "Audio WAV (W01 - Y99 Series)", 
    value: "AUDIO_WAV", 
    range: "W01-Y99",
    prefix: "W",
    alphaRange: true
  },
  { 
    label: "Photos (P01 - Q99 Series)", 
    value: "PHOTOS", 
    range: "P01-Q99",
    prefix: "P",
    alphaRange: true
  },
  { 
    label: "Project File (H01 - L99 Series)", 
    value: "PROJECT_FILE", 
    range: "H01-L99",
    prefix: "H",
    alphaRange: true
  },
  { 
    label: "WOT File", 
    value: "WOT_FILE", 
    range: "WOT",
    prefix: "WOT",
    fixedCode: true
  },
  { 
    label: "Bapa Katha", 
    value: "BAPA_KATHA", 
    range: "BK",
    prefix: "BK",
    fixedCode: true
  },
  { 
    label: "WT File", 
    value: "WT_FILE", 
    range: "WT",
    prefix: "WT",
    fixedCode: true
  },
  { 
    label: "SM Design", 
    value: "SM_DESIGN", 
    range: "SM",
    prefix: "SM",
    fixedCode: true
  }
];

// ==========================================
// CONTENT CODE GENERATOR
// ==========================================
const generateContentCodes = (type: string, count: number): string[] => {
  const codeType = CONTENT_CODE_TYPES.find(t => t.value === type);
  if (!codeType) return [];

  const codes: string[] = [];

  if (codeType.fixedCode) {
    // For fixed codes like WOT, BK, WT, SM
    for (let i = 1; i <= count; i++) {
      codes.push(`${codeType.prefix}_${String(i).padStart(3, '0')}`);
    }
  } else if (codeType.alphaRange) {
    // For alpha series like A01-E99, M01-O99, etc.
    const startChar = codeType.prefix.charCodeAt(0);
    let currentNum = 1;
    let currentChar = startChar;

    for (let i = 0; i < count; i++) {
      codes.push(`${String.fromCharCode(currentChar)}${String(currentNum).padStart(2, '0')}`);
      currentNum++;
      if (currentNum > 99) {
        currentNum = 1;
        currentChar++;
      }
    }
  } else {
    // For numeric series like 700-799, 001-199, etc.
    const startNum = typeof codeType.startNum === "number" ? codeType.startNum : 0;
    const endNum = typeof codeType.endNum === "number" ? codeType.endNum : 0;
    const nextPrefix = codeType.nextPrefix;
    let currentNum = startNum;

    for (let i = 0; i < count; i++) {
      if (currentNum <= endNum) {
        codes.push(String(currentNum).padStart(String(endNum).length, '0'));
        currentNum++;
      } else if (nextPrefix) {
        // Overflow to next series (e.g., 700 series to 800)
        codes.push(`${nextPrefix}${String(i - (endNum - codeType.startNum + 1) + 1).padStart(3, '0')}`);
      }
    }
  }

  return codes;
};

// ==========================================
// TEMPLATE OPTIONS & DEFINITIONS
// ==========================================
const TEMPLATES: Record<string, any> = {
  "Ashram Events 1 to 2days": {
    project: { location: "Shrimad Rajchandra Ashram Dharampur", country: "India", state: "Gujarat", city: "Dharampur" },
    dr: [
      { folderName: "AshramEvent_Session_1", formatType: "MP4", noOfFiles: "1" },
      { folderName: "AshramEvent_Session_2", formatType: "MP4", noOfFiles: "1" }
    ]
  },
  "Ashram Events 3+DAYS": {
    project: { location: "Shrimad Rajchandra Ashram Dharampur", country: "India", state: "Gujarat", city: "Dharampur" },
    dr: [
      { folderName: "AshramEventLong_Session_1", formatType: "MP4", noOfFiles: "1" },
      { folderName: "AshramEventLong_Session_2", formatType: "MP4", noOfFiles: "1" },
      { folderName: "AshramEventLong_Session_3", formatType: "MP4", noOfFiles: "1" }
    ]
  },
  "Ashram Monthly": {
    project: { location: "Shrimad Rajchandra Ashram Dharampur", country: "India", state: "Gujarat", city: "Dharampur" },
    dr: [
      { folderName: "AshramMonthly_Session_1", formatType: "MP4", noOfFiles: "1" }
    ]
  },
  "GM": {
    project: { location: "Headquarters", country: "India", state: "Gujarat", city: "Dharampur" },
    dr: [
      { folderName: "GM_Session_1", formatType: "MP4", noOfFiles: "1" }
    ]
  },
  "Long Yatra": {
    project: { location: "Yatra Location", country: "India", state: "Various", city: "Various" },
    dr: [
      { folderName: "LongYatra_Day1", formatType: "MP4", noOfFiles: "2" },
      { folderName: "LongYatra_Day2", formatType: "MP4", noOfFiles: "2" }
    ]
  },
  "LRD Single Day Event": {
    project: { location: "Event Location", country: "India", state: "Gujarat", city: "Dharampur" },
    dr: [
      { folderName: "LRDEvent_Session_1", formatType: "MP4", noOfFiles: "1" }
    ]
  },
  "MahotsavParyushan": {
    project: { location: "Shrimad Rajchandra Ashram Dharampur", country: "India", state: "Gujarat", city: "Dharampur" },
    dr: [
      { folderName: "Mahotsav_Day1", formatType: "MP4", noOfFiles: "3" },
      { folderName: "Mahotsav_Day2", formatType: "MP4", noOfFiles: "3" }
    ]
  },
  "Medium Yatra": {
    project: { location: "Yatra Location", country: "India", state: "Gujarat", city: "Various" },
    dr: [
      { folderName: "MediumYatra_Session_1", formatType: "MP4", noOfFiles: "1" }
    ]
  },
  "Sadguru Udghosh": {
    project: { location: "Shrimad Rajchandra Ashram Dharampur", country: "India", state: "Gujarat", city: "Dharampur" },
    dr: [
      { folderName: "SU_Session_1", formatType: "MP4", noOfFiles: "1" },
      { folderName: "SU_Session_2", formatType: "MP4", noOfFiles: "1" }
    ]
  },
  "Bapa Katha": {
    project: { location: "Shrimad Rajchandra Ashram Dharampur", country: "India", state: "Gujarat", city: "Dharampur" },
    dr: [
      { folderName: "BapaKatha_Session_1", formatType: "MP4", noOfFiles: "1" }
    ]
  },
   "Pravachan at Yogi": {
    project: { 
      location: "Yogi Sabhagruh", 
      country: "India", 
      state: "Maharashtra", 
      city: "Mumbai" 
    },
    dr: [
      { folderName: "PravachanYogi_Session_1", formatType: "MP4", noOfFiles: "1" }
    ]
  },
  "Satsang Shibir": {
    project: { location: "Shibir Location", country: "India", state: "Gujarat", city: "Dharampur" },
    dr: [
      { folderName: "SatsangShibir_Session_1", formatType: "MP4", noOfFiles: "2" }
    ]
  },
  "AE Submission": {
    project: { location: "Ashram Events", country: "India", state: "Gujarat", city: "Dharampur" },
    dr: [
      { folderName: "AESubmission_Session_1", formatType: "MP4", noOfFiles: "1" }
    ]
  },
  "Audio Merge Submission": {
    project: { location: "Audio Archive", country: "India", state: "Gujarat", city: "Dharampur" },
    dr: [
      { folderName: "AudioMerge_Session_1", formatType: "MP3", noOfFiles: "1" }
    ]
  },
  "Discourse Shibir Session Training": {
    project: { location: "Training Center", country: "India", state: "Gujarat", city: "Dharampur" },
    dr: [
      { folderName: "DiscourseTraining_Session_1", formatType: "MP4", noOfFiles: "1" }
    ]
  },
  "Edited - HighlightsPEPPromos Single": {
    project: { location: "Studio", country: "India", state: "Gujarat", city: "Dharampur" },
    dr: [
      { folderName: "EditedHighlights_1", formatType: "MP4", noOfFiles: "1" }
    ]
  },
  "LED": {
    project: { location: "LED Display", country: "India", state: "Gujarat", city: "Dharampur" },
    dr: [
      { folderName: "LED_Content_1", formatType: "MP4", noOfFiles: "1" }
    ]
  },
  "Old Project Rectification": {
    project: { location: "Archive", country: "India", state: "Gujarat", city: "Dharampur" },
    dr: [
      { folderName: "OldProject_Rectified_1", formatType: "MP4", noOfFiles: "1" }
    ]
  },
  "Production non satsang": {
    project: { location: "Studio", country: "India", state: "Gujarat", city: "Dharampur" },
    dr: [
      { folderName: "Production_NonSatsang_1", formatType: "MP4", noOfFiles: "1" }
    ]
  },
  "Production Satsang": {
    project: { location: "Studio", country: "India", state: "Gujarat", city: "Dharampur" },
    dr: [
      { folderName: "Production_Satsang_1", formatType: "MP4", noOfFiles: "1" }
    ]
  }
};

const emptyProject = {
  name: "",
  autoEventCode: "",
  assignee: "",
  dateCreated: "",
  submitterDeadline: "",
  eventFrom: "",
  eventTo: "",
  projectType: "",
  dateFrom: "",
  dateTo: "",
  location: "",
  country: "",
  state: "",
  city: "",
  template: "",
  contCodeType: "",
  contCodeCount: 1
};

const emptyDrRow = {
  
  folderName: "",
  subFolder1: "",
  subFolder2: "",
  dmFolderFileName: "",
  noOfFiles: "",
  formatType: "",
  videoBitrate: "",
  audioBitrate: "",
  fileSizeBytes: "",
  duration: "",
  remarks: "",
  errorCounter: "",
  reasonForError: "",
  distributionProductTitle: "",
  masterQuality: "",
  associatedDr: "",
  qcSevak: "",
  distributionDriveLink: "",
  fileSizeGb: "",
  digitalCode: "",  // ← This will be auto-populated
  visibleFilesize: "",
  filePath: "",
  _comments: {}
};

const emptyMlRow = {
  footageSrNo: "",
  logSrNo: "",
  eventCode: "",
  dmCode: "",
  mlUniqueId: "",
  contentDateFrom: "",
  contentDateTo: "",
  timeOfDay: "",
  occasion: "",
  editingStatus: "",
  footageType: "",
  contentDetails: "",
  contentSubDetails: "",
  segmentCategory: "",
  counterFrom: "",
  counterTo: "",
  subDuration: "",
  totalDuration: "",
  contentLanguage: "",
  contentSpeaker: "",
  saintsOrganization: "",
  speakerDesignation: "",
  contentCountry: "",
  contentState: "",
  contentCity: "",
  contentLocation: "",
  lowResDrCode: "",
  lowResMlId: "",
  lowResSubtitle: "",
  lowResRemarks: "",
  lowResCounterFrom: "",
  lowResCounterTo: "",
  lowResTotalDuration: "",
  granthName: "",
  granthNumber: "",
  topic: "",
  topicGivenBy: "",
  keywords: "",
  satsangStart: "",
  satsangEnd: "",
  audioMp3DrCode: "",
  audioWavDrCode: "",
  remarks: "",
  footagePrivacy: "",
  bapaNotPresent: "",
  guidanceReceived: "",
  eventRefRemarks: "",
  eventRef1MLId: "",
  eventRef2MLId: "",
  subTitles: "",
  subTitlesLanguage: "",
  editingTypeAudio: "",
  bhajanTypeTheme: "",
  grading: "",
  _comments: {}
};

const DR_COLUMNS = [
  
  { key: "folderName", label: "Folder Name", type: "text", disabled: false, styling: { width: "150px" } },
  { key: "subFolder1", label: "Sub Folder Level 1", type: "text", disabled: false, styling: { width: "150px" } },
  { key: "subFolder2", label: "Sub Folder Level 2", type: "text", disabled: false, styling: { width: "150px" } },
  { key: "dmFolderFileName", label: "Digital Master Folder/File", type: "text", disabled: false, styling: { width: "180px" } },
  { key: "noOfFiles", label: "No of Files", type: "text", disabled: false, styling: { width: "100px" } },
  { key: "formatType", label: "Format Type", type: "text", disabled: false, styling: { width: "100px" } },
  { key: "videoBitrate", label: "Video Bitrate", type: "text", disabled: true, styling: { width: "120px" } },
  { key: "audioBitrate", label: "Audio Bitrate", type: "text", disabled: true, styling: { width: "120px" } },
  { key: "fileSizeBytes", label: "File Size (Bytes)", type: "text", disabled: true, styling: { width: "130px" } },
  { key: "duration", label: "Duration", type: "text", disabled: true, styling: { width: "100px" } },
  { key: "remarks", label: "Remarks (Errors if Approved)", type: "text", disabled: false, styling: { width: "150px" } },
  { key: "errorCounter", label: "Counter of Error", type: "text", disabled: false, styling: { width: "120px" } },
  { key: "reasonForError", label: "Reason for Error", type: "text", disabled: false, styling: { width: "150px" } },
  { key: "distributionProductTitle", label: "Distribution/Product Title", type: "text", disabled: false, styling: { width: "160px" } },
  { key: "masterQuality", label: "Master Quality?", type: "text", disabled: false, styling: { width: "100px" } }, // ← Changed from select to text
  { key: "associatedDr", label: "Associated DR", type: "text", disabled: false, styling: { width: "120px" } },
  { key: "qcSevak", label: "QC Sevak", type: "text", disabled: false, styling: { width: "120px" } },
  { key: "distributionDriveLink", label: "Distribution Drive Link", type: "text", disabled: false, styling: { width: "180px" } },
  { key: "fileSizeGb", label: "File Size (GB)", type: "text", disabled: true, styling: { width: "110px" } },
 // ... other columns
  { key: "dmCode", label: "Digital Code", type: "text", disabled: false, styling: { width: "130px" } },
  { key: "visibleFilesize", label: "Visible File Size", type: "text", disabled: true, styling: { width: "130px" } },
  { key: "filePath", label: "File Path", type: "text", disabled: true, styling: { width: "200px" } }
];

const ML_COLUMNS = [
  { key: "footageSrNo", label: "Footage Sr. No.", type: "text", disabled: true, styling: { width: "100px" } },
  { key: "logSrNo", label: "Log Sr.No", type: "text", disabled: true, styling: { width: "100px" } },
  { key: "eventCode", label: "Event Code", type: "text", disabled: false, styling: { width: "120px" } },
  { key: "dmCode", label: "Digital Media Code", type: "dr-select", disabled: false, styling: { width: "140px" } },
  { key: "mlUniqueId", label: "ML Unique ID", type: "text", disabled: true, styling: { width: "140px" } },
  { key: "contentDateFrom", label: "Content Date From (dd.mm.yyyy)", type: "text", placeholder: "dd.mm.yyyy", disabled: false, styling: { width: "140px" } },
  { key: "contentDateTo", label: "Content Date To (dd.mm.yyyy)", type: "text", placeholder: "dd.mm.yyyy", disabled: false, styling: { width: "140px" } },
    { 
    key: "timeOfDay", 
    label: "Time of Day", 
    type: "select", 
    options: ["Eve", "Morn", "Aft", "Night", " "], 
    disabled: false, 
    styling: { width: "100px" } 
  },  
   { 
    key: "occasion", 
    label: "Occasion", 
    type: "select", 
    options: [" ", "American Independence Day","Anniversary","Atmarpit Maulikji's Birthday","Atmarpit Nemiji's Birthday","Ayambil Oli","Buddha Purnima","Children's Day","Christmas","Diwali","Dussehra","Earth Day","Easter","Father's Day","Friendship Day","Gandhi Jayanti","Ganesh Chaturthi","Gudi Padwa","Gujarati New Year","Gurupurnima","Halloween","Independence Day","International Yoga Day","Janmashtami","Jnanpancham","Mahashivratri","Mahatma Gandhiji Death Anniversary","Mahavira Jayanti","Mahavira Jayanti (Paryushan Parva)","Maun Ekadashi" ,"Mother's Day","Navratri","New Year","Param Krupalu Dev's Birth Anniversary","Param Krupalu Dev's Dehvilaydin","Param Krupalu Dev's Shuddh Samkit","Paryushan Parva","Pujya Gurudevshri's Birth Anniversary","Pujya Gurudevshri's Birth Anniversary as per Gujarati Calendar","Pujya Gurudevshri's Sanyas Din as per Gujarati Calendar","Rakshabandhan","Ram Navmi","Rangotsav","Republic Day","Sharad Purnima","Shri Atmasiddhi Shastra Rachnadin","Teachers’ Day","Utaran","Valentine's Day","Varshitap Parna/Akha Trij","Vasant Panchami","Param Krupalu Dev's Padhramani in Dharampur","Kabir Jayanti","Thanksgiving","Pujya Gurudevshri's Adhyatmik Birth Anniversary","Atmarpit Nemiji Samkit Din (Kartik Sud Beej)"],
    disabled: false, 
    styling: { width: "180px" } 
  },
   { 
    key: "editingStatus", 
    label: "Editing Status", 
    type: "select", 
    options: ["Edited", "Edited_Controversial", "Edited (With Titles)", "Edited (Without Titles)", "Semi-Edited", "Unedited", "Full Animated", " "], 
    disabled: false, 
    styling: { width: "120px" } 
  },
 { 
    key: "footageType", 
    label: "Footage Type", 
    type: "select", 
    options: [" ","AS IT IS", "Glimpses", "Slide Show", "Extracted", "Only Glimpses", "LED Projection", "Only Photos", "Pre-Recorded", "Side Angle/Camera/Unmixed", "Version - Content", "Version-Content+Duration", "Version - Dubbed", "Version - Dubbed + Duration", "Version - Duration", "Version - FX/Additions", "Version - FX/Additions + Dubbed", "Version - Split/Parts", "Version - Abrupt/Error", "Version - Copy", "AS IT IS - Topic", "AS IT IS - Language", "AS IT IS - Split", "AS IT IS - Camera", "Higher Quality Copy", "Raw - For Markers", "Only Photos - For Edited Videos", "Static/Design", "Live - Uncut"], 
    disabled: false, 
    styling: { width: "130px" } // Adjusted from 160px to be more compact
  },
  { key: "contentDetails", label: "Content Details", type: "text", disabled: false, styling: { width: "150px" } },
  { key: "contentSubDetails", label: "Content Sub Details", type: "text", disabled: false, styling: { width: "150px" } },
 { 
    key: "segmentCategory", 
    label: "Segment Category", 
    type: "select", 
    options: [" ","Pujan","Pravachan","Prasangik Udbodhan","SU","SU - GM","SU - Extracted","SU - Revision","SU - Capsule","Satsang","Informal Satsang","Nemiji:Satsang","SRMD - Shibirs/Session/Training/Workshops","Non-SRMD - Shibirs/Session/Training/Workshops","SU:SRMD - Shibirs/Session/Training/Workshops","Pratishtha","Padhramani","Padhramani:Pratishtha","Meditation","Drama/Skit","Prarthana","Bhakti","Celebrations","Celebrations:Bhakti","Celebrations:Drama/Skit","Celebrations:Heartfelt Experience","Heartfelt Experiences","Highlights","Highlights - Informal","Highlights - Mixed","PEP - Post Event Promo","Satsang Clips","Other Clips","Promo","Documentary","Other Edited Videos","Product/Webseries","Event/Feel Good Reel","Bhakti:Drama/Skit"],
    disabled: false, 
    styling: { width: "180px" } 
  },
  { key: "counterFrom", label: "Counter From", type: "text", placeholder: "HH:MM:SS", disabled: false, styling: { width: "120px" } },
  { key: "counterTo", label: "Counter To", type: "text", placeholder: "HH:MM:SS", disabled: false, styling: { width: "120px" } },
  { key: "subDuration", label: "Sub Duration", type: "text", disabled: true, styling: { width: "110px" } },
  { key: "totalDuration", label: "Total Duration", type: "text", disabled: true, styling: { width: "110px" } },
    { 
    key: "contentLanguage", 
    label: "Content Language", 
    type: "select", 
    options: [" ","English", "Gujrati","Hindi","Eng-Guj","Guj-Hin","Eng-Hin","Other","Marathi","Bengali","Kannada","Tamil","French","German","Mandarin","Spanish"],
    disabled: false, 
    styling: { width: "130px" } 
  },
  { key: "contentSpeaker", label: "Content Speaker/Singer", type: "text", disabled: false, styling: { width: "150px" } },
  { key: "saintsOrganization", label: "Saints/Speaker's Organization", type: "text", disabled: false, styling: { width: "160px" } },
  { key: "speakerDesignation", label: "Designation/Profession", type: "text", disabled: false, styling: { width: "140px" } },
  { key: "contentCountry", label: "Content Country", type: "text", disabled: false, styling: { width: "130px" } },
  { key: "contentState", label: "Content State/Province", type: "text", disabled: false, styling: { width: "140px" } },
  { key: "contentCity", label: "Content City/Town", type: "text", disabled: false, styling: { width: "130px" } },
  { key: "contentLocation", label: "Content Location", type: "text", disabled: false, styling: { width: "140px" } },
  { key: "lowResDrCode", label: "Low Res DR Code", type: "text", disabled: false, styling: { width: "130px" } },
  { key: "lowResMlId", label: "Low Res ML ID", type: "text", disabled: false, styling: { width: "130px" } },
  { key: "lowResSubtitle", label: "Low Res Subtitle", type: "text", disabled: false, styling: { width: "130px" } },
  { key: "lowResRemarks", label: "Low Res Remarks", type: "text", disabled: false, styling: { width: "130px" } },
  { key: "lowResCounterFrom", label: "Low Res Counter From", type: "text", placeholder: "HH:MM:SS", disabled: false, styling: { width: "140px" } },
  { key: "lowResCounterTo", label: "Low Res Counter To", type: "text", placeholder: "HH:MM:SS", disabled: false, styling: { width: "140px" } },
  { key: "lowResTotalDuration", label: "Low Res Total Duration", type: "text", disabled: true, styling: { width: "140px" } },
  { key: "granthName", label: "Granth Name", type: "text", disabled: false, styling: { width: "130px" } },
  { key: "granthNumber", label: "Number (Patrank/Adhyay/Prakaran/Padd/Shlok)", type: "text", disabled: false, styling: { width: "180px" } },
  { key: "topic", label: "Topic", type: "text", disabled: false, styling: { width: "130px" } },
  { key: "topicGivenBy", label: "Topic Given By", type: "text", disabled: false, styling: { width: "130px" } },
  { key: "keywords", label: "Keywords", type: "text", disabled: false, styling: { width: "140px" } },
  { key: "satsangStart", label: "Satsang START (3 words)", type: "text", disabled: false, styling: { width: "140px" } },
  { key: "satsangEnd", label: "Satsang End (3 words)", type: "text", disabled: false, styling: { width: "140px" } },
  { key: "audioMp3DrCode", label: "Audio MP3 DR Code", type: "text", disabled: false, styling: { width: "140px" } },
  { key: "audioWavDrCode", label: "Audio WAV DR Code", type: "text", disabled: false, styling: { width: "140px" } },
  { key: "remarks", label: "Remarks", type: "text", disabled: false, styling: { width: "140px" } },
  { key: "footagePrivacy", label: "Footage (VERY PRIVATE?)", type: "select", options: [" ", "Informal"], disabled: false, styling: { width: "130px" } },
  { key: "bapaNotPresent", label: "If Bapa NOT Present", type: "text", disabled: false, styling: { width: "130px" } },
  { key: "guidanceReceived", label: "Guidance from PPG/Hierarchy", type: "text", disabled: false, styling: { width: "160px" } },
  { key: "eventRefRemarks", label: "Event Reference - Remarks/Counters", type: "text", disabled: false, styling: { width: "160px" } },
  { key: "eventRef1MLId", label: "Event Reference 1 - ML ID", type: "text", disabled: false, styling: { width: "150px" } },
  { key: "eventRef2MLId", label: "Event Reference 2 - ML ID", type: "text", disabled: false, styling: { width: "150px" } },
  { key: "subTitles", label: "Sub-Titles", type: "text", disabled: false, styling: { width: "130px" } },
  { key: "subTitlesLanguage", label: "Sub Titles Language", type: "text", disabled: false, styling: { width: "130px" } },
  { key: "editingTypeAudio", label: "Editing Type (Audio)", type: "text", disabled: false, styling: { width: "130px" } },
  { key: "bhajanTypeTheme", label: "Bhajan Type/Theme", type: "text", disabled: false, styling: { width: "130px" } },
  { key: "grading", label: "Grading", type: "text", disabled: false, styling: { width: "90px" } }
];

// --- STYLES ---
const styles = {
  wrapper: {
    display: "flex", flexDirection: "column" as "column", height: "100%", color: "#fff",
    background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "20px", padding: "24px",
    overflowY: "auto" as "auto", overflowX: "hidden" as "hidden", position: "relative" as "relative"
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px"
  },
  section: {
    background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", 
    borderRadius: "12px", padding: "20px", marginBottom: "24px", transition: "all 0.3s ease"
  },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" },
  inputWrapper: { display: "flex", flexDirection: "column" as "column", gap: "4px" },
  label: { fontSize: "0.7rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" as "uppercase" },
 input: {
    backgroundColor: "rgba(0,0,0,0.3)", 
    border: "1px solid rgba(255,255,255,0.1)", 
    color: "#fff",
    height: "36px", 
    borderRadius: "6px", 
    padding: "0 10px", 
    outline: "none", 
    fontSize: "0.85rem", 
    width: "100%",
    colorScheme: "dark" // <--- ADD THIS LINE
  },
 tableWrapper: { 
  overflowX: "auto" as "auto", 
  width: "100%", 
  border: "1px solid rgba(255,255,255,0.1)", 
  borderRadius: "8px", 
  marginTop: "10px", 
  userSelect: "none" as "none",
  minHeight: "400px" // ADDED: Ensuring there is enough room for dropdowns to go down
},
  table: { width: "100%", borderCollapse: "collapse" as "collapse", fontSize: "0.8rem", whiteSpace: "nowrap" as "nowrap" },
 th: { 
    textAlign: "center" as "center", // Changed from left to center
    borderBottom: "1px solid rgba(255,255,255,0.1)", 
    background: "rgba(0,0,0,0.4)", 
    color: "#94a3b8", 
    fontWeight: 600,
    fontSize: "0.75rem"
  },
  td: { 
    padding: "0", 
    textAlign: "center" as "center", // Ensure container centers content
    borderBottom: "1px solid rgba(255,255,255,0.05)", 
    borderRight: "1px solid rgba(255,255,255,0.05)" 
  },
  cellInput: {
    width: "100%", 
    height: "38px", 
    background: "transparent", 
    border: "none", 
    color: "#fff", 
    padding: "0 10px", 
    outline: "none", 
    fontSize: "0.8rem", 
    boxSizing: "border-box" as "border-box", 
    textOverflow: "ellipsis",
    textAlign: "center" as "center" // ADDED: Centers text in standard inputs
  },
  buttonPrimary: {
    background: "linear-gradient(to right, #3b82f6, #06b6d4)", border: "none", borderRadius: "8px",
    padding: "8px 16px", color: "white", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", transition: "opacity 0.2s"
  },
  buttonSecondary: {
    background: "linear-gradient(to right, #8b5cf6, #d946ef)", border: "none", borderRadius: "8px",
    padding: "8px 16px", color: "white", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", transition: "opacity 0.2s"
  },
  buttonSuccess: {
    background: "linear-gradient(to right, #10b981, #059669)", border: "none", borderRadius: "8px",
    padding: "10px 20px", color: "white", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", transition: "opacity 0.2s"
  }
};

export function ProjectHubWorkflow({ onBack }: { onBack: () => void }) {
  // Application View State
  const [viewMode, setViewMode] = useState<'list' | 'editor' | 'template-select'>('list');
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
type User = { id: string; name: string; avatar?: string; role?: string };
const [availableUsers, setAvailableUsers] = useState<User[]>([]);
useEffect(() => {
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('app-token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users for assignee list:", error);
    }
  };
  fetchUsers();
}, []);
const [assigneeSearch, setAssigneeSearch] = useState("");
const renderAssigneePicker = () => {
  // Split the string into an array to handle multiple selected users
  const selectedNames = project.assignee ? project.assignee.split(", ") : [];
  
  // Filter users based on the search query
  const filteredUsers = availableUsers.filter(u => 
    u.name.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  const toggleUser = (userName: string) => {
    let newSelection;
    if (selectedNames.includes(userName)) {
      newSelection = selectedNames.filter(name => name !== userName);
    } else {
      newSelection = [...selectedNames, userName];
    }
    setProject({ ...project, assignee: newSelection.join(", ") });
  };

  return (
    <div style={{ ...styles.inputWrapper, gridColumn: "auto" }}>
      <span style={styles.label}>Assignees</span>

      <div style={{ position: "relative" }}>
        <DropdownMenu onOpenChange={(open) => !open && setAssigneeSearch("")}>
          <DropdownMenuTrigger asChild>
            <div
              style={{
                ...styles.input,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "4px 8px",
                height: "auto",
                minHeight: "36px",
                flexWrap: "wrap"
              }}
            >
              {selectedNames.length > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                   <div style={{ display: "flex", marginLeft: "4px" }}>
                    {selectedNames.slice(0, 3).map((name, i) => {
                      const u = availableUsers.find(user => user.name === name);
                      return (
                        <Avatar key={name} style={{ 
                          height: 22, width: 22, 
                          border: "2px solid #0f172a", 
                          marginLeft: i === 0 ? 0 : -8,
                          zIndex: 10 - i 
                        }}>
                          <AvatarImage src={u?.avatar} />
                          <AvatarFallback style={{ fontSize: '8px', background: '#2563eb' }}>{name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      );
                    })}
                    {selectedNames.length > 3 && (
                      <div style={{ 
                        fontSize: '10px', background: '#334155', height: 22, width: 22, 
                        borderRadius: '50%', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', marginLeft: -8, border: "2px solid #0f172a",
                        zIndex: 1
                      }}>+{selectedNames.length - 3}</div>
                    )}
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "#fff", marginLeft: "4px" }}>
                    {selectedNames.length === 1 ? selectedNames[0] : `${selectedNames.length} Assigned`}
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b" }}>
                  <Plus size={14} />
                  <span style={{ fontSize: "0.85rem" }}>Assign...</span>
                </div>
              )}
              <ChevronDown size={14} style={{ marginLeft: "auto", opacity: 0.5 }} />
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            style={{
              width: "280px",
              background: "#0f172a",
              border: "1px solid #334155",
              color: "#fff",
              borderRadius: "8px",
              padding: "8px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
            }}
          >
            {/* SEARCH INPUT */}
            <div style={{ position: "relative", marginBottom: "8px" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                autoFocus
                placeholder="Search team members..."
                value={assigneeSearch}
                onChange={(e) => setAssigneeSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "100%",
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "6px",
                  padding: "6px 10px 6px 32px",
                  color: "#fff",
                  fontSize: "13px",
                  outline: "none"
                }}
              />
            </div>

            <DropdownMenuSeparator style={{ background: "#334155" }} />

            <div style={{ maxHeight: "240px", overflowY: "auto", marginTop: "4px" }} className="custom-scrollbar">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isSelected = selectedNames.includes(u.name);
                  return (
                    <div
                      key={u.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleUser(u.name);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 10px",
                        cursor: "pointer",
                        borderRadius: "6px",
                        background: isSelected ? "rgba(37, 99, 235, 0.15)" : "transparent",
                        marginBottom: "2px"
                      }}
                      onMouseEnter={e => !isSelected && (e.currentTarget.style.background = "#1e293b")}
                      onMouseLeave={e => !isSelected && (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ 
                        width: 16, height: 16, border: "1px solid #475569", borderRadius: "4px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: isSelected ? "#2563eb" : "transparent",
                        borderColor: isSelected ? "#2563eb" : "#475569"
                      }}>
                        {isSelected && <CheckCircle2 size={12} color="#fff" />}
                      </div>

                      <Avatar style={{ height: 26, width: 26 }}>
                        <AvatarImage src={u.avatar} />
                        <AvatarFallback style={{ background: "#334155", fontSize: "10px" }}>
                          {u.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {u.name}
                        </span>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{u.role}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
                  No members found
                </div>
              )}
            </div>

            {selectedNames.length > 0 && (
              <>
                <DropdownMenuSeparator style={{ background: "#334155" }} />
                <div
                  onClick={() => setProject({ ...project, assignee: "" })}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    cursor: "pointer",
                    color: "#f87171",
                    fontSize: "13px"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(248, 113, 113, 0.1)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <UserX size={14} />
                  <span>Clear All</span>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
  // Load Saved Projects from Local Storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('avdept_projectHubData');
    if (saved) {
      try {
        setSavedProjects(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved projects");
      }
    }
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProjectCreated, setIsProjectCreated] = useState(false);
  
  // Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);

  // Tab State
  const [activeTab, setActiveTab] = useState<'DR' | 'ML'>('DR');

  const [showTemplateSelect, setShowTemplateSelect] = useState(false);

  const [project, setProject] = useState(emptyProject);

  const [drRows, setDrRows] = useState<any[]>([]);
  const [mlRows, setMlRows] = useState<any[]>([]);

  // Search State
  const [drSearch, setDrSearch] = useState("");
  const [mlSearch, setMlSearch] = useState("");

  // Excel State
  const [dragState, setDragState] = useState<{ table: string, startRow: number, currentRow: number, currentCol: string, startValue: any } | null>(null);
  const [commentPopup, setCommentPopup] = useState<{ table: string, rowIdx: number, colKey: string, x: number, y: number, value: string } | null>(null);

  useEffect(() => {
    const handleMouseUp = () => { if (dragState) applyDragFill(); };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [dragState, drRows, mlRows]);

  // ==========================================
  // PROJECT LIFECYCLE MANAGEMENT
  // ==========================================
  const handleStartNewProject = () => {
    setProject({
      ...emptyProject,
      autoEventCode: generateCode('EVT-', 6),
      dateCreated: new Date().toISOString().split('T')[0]
    });
    setDrRows([]);
    setMlRows([]);
    setIsProjectCreated(false);
    setActiveTab('DR');
    setViewMode('editor');
  };

  const handleOpenProject = (proj: any) => {
    setProject(proj.metadata);
    setDrRows(proj.drLayer || []);
    setMlRows(proj.mlLayer || []);
    setIsProjectCreated(true);
    setActiveTab('DR');
    setViewMode('editor');
  };

  const handleDeleteProject = (e: React.MouseEvent, eventCode: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project locally?")) {
      const updated = savedProjects.filter(p => p.id !== eventCode);
      setSavedProjects(updated);
      localStorage.setItem('avdept_projectHubData', JSON.stringify(updated));
      toast.success("Project deleted locally");
    }
  };

  const submitEntireProject = () => {
    if (!project.name) return toast.error("Project Name is required.");
    
    const newProjectData = {
      id: project.autoEventCode,
      metadata: project,
      drLayer: drRows,
      mlLayer: mlRows,
      updatedAt: new Date().toISOString()
    };

    const existingIndex = savedProjects.findIndex(p => p.id === project.autoEventCode);
    let updatedProjects = [...savedProjects];
    
    if (existingIndex >= 0) {
      updatedProjects[existingIndex] = newProjectData;
    } else {
      updatedProjects.unshift(newProjectData); 
    }

    localStorage.setItem('avdept_projectHubData', JSON.stringify(updatedProjects));
    setSavedProjects(updatedProjects);
    
    toast.success("Project Hub Data Saved Locally!");
    setViewMode('list');
  };

  // ==========================================
  // PUSH TO DB TRIGGER LOGIC
  // ==========================================
  const handlePushToDB = async (e: React.MouseEvent, proj: any) => {
    e.stopPropagation();
    
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)), // Fake DB Network Call Delay
      {
        loading: `Pushing "${proj.metadata.name}" to Central Database...`,
        success: () => {
          console.log("READY TO PUSH DATA TO DB:", proj); // The exact payload for your backend API
          return `Successfully pushed to DB!`;
        },
        error: "Failed to push to database."
      }
    );

    /* 
    TODO: Insert Actual Backend Fetch Logic Here!
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proj)
      });
      if (response.ok) {
        toast.success("Database sync complete!");
      }
    } catch(err) {
      toast.error("Database connection failed");
    }
    */
  };

  // ==========================================
  // EXCEL DRAG & DOUBLE CLICK TO FILL LOGIC
  // ==========================================
 const applyDragFill = () => {
    if (!dragState) return;
    const { table, startRow, currentRow, currentCol, startValue } = dragState;
    const minRow = Math.min(startRow, currentRow);
    const maxRow = Math.max(startRow, currentRow);

    const columns = table === 'DR' ? DR_COLUMNS : ML_COLUMNS;
    const colDef = columns.find(c => c.key === currentCol);
    if (colDef?.disabled) { setDragState(null); return; }

    const isSelect = colDef?.type === 'select' || colDef?.type === 'dr-select';

    if (table === 'DR') {
      let newRows = [...drRows];
      for (let i = minRow; i <= maxRow; i++) {
        const step = i - startRow;
        newRows[i] = { ...newRows[i], [currentCol]: calculateSmartFillValue(startValue, step, !isSelect) };
      }
      setDrRows(newRows);
    } 
    else if (table === 'ML') {
      let newRows = [...mlRows];
      for (let i = minRow; i <= maxRow; i++) {
        const step = i - startRow;
        newRows[i] = { ...newRows[i], [currentCol]: calculateSmartFillValue(startValue, step, !isSelect) };
        
        // Auto-calculate durations for dragged counters
        if (['counterFrom', 'counterTo', 'lowResCounterFrom', 'lowResCounterTo'].includes(currentCol)) {
          newRows[i].subDuration = calculateDuration(newRows[i].counterFrom, newRows[i].counterTo);
          newRows[i].totalDuration = newRows[i].subDuration;
          newRows[i].lowResTotalDuration = calculateDuration(newRows[i].lowResCounterFrom, newRows[i].lowResCounterTo);
        }
      }
      // Re-trigger serial numbers if DM code was dragged
      if (currentCol === 'dmCode') newRows = recalculateMLSerials(newRows, project.autoEventCode);
      setMlRows(newRows);
    }
    setDragState(null);
  };

 const handleDoubleClickFill = (table: 'DR' | 'ML', startRow: number, currentCol: string, startValue: any) => {
    const columns = table === 'DR' ? DR_COLUMNS : ML_COLUMNS;
    const colDef = columns.find(c => c.key === currentCol);
    if (colDef?.disabled) return;
    const isSelect = colDef?.type === 'select' || colDef?.type === 'dr-select';

    if (table === 'DR') {
      let newRows = [...drRows];
      for (let i = startRow + 1; i < newRows.length; i++) {
        newRows[i] = { ...newRows[i], [currentCol]: calculateSmartFillValue(startValue, i - startRow, !isSelect) };
      }
      setDrRows(newRows);
    } else {
      let newRows = [...mlRows];
      for (let i = startRow + 1; i < newRows.length; i++) {
        newRows[i] = { ...newRows[i], [currentCol]: calculateSmartFillValue(startValue, i - startRow, !isSelect) };
        if (['counterFrom', 'counterTo', 'lowResCounterFrom', 'lowResCounterTo'].includes(currentCol)) {
           newRows[i].subDuration = calculateDuration(newRows[i].counterFrom, newRows[i].counterTo);
           newRows[i].totalDuration = newRows[i].subDuration;
           newRows[i].lowResTotalDuration = calculateDuration(newRows[i].lowResCounterFrom, newRows[i].lowResCounterTo);
        }
      }
      if (currentCol === 'dmCode') newRows = recalculateMLSerials(newRows, project.autoEventCode);
      setMlRows(newRows);
    }
  };

  // ==========================================
  // EXCEL COMMENTS LOGIC
  // ==========================================
  const handleContextMenu = (e: React.MouseEvent, table: string, rowIdx: number, colKey: string) => {
    e.preventDefault();
    const row = table === 'DR' ? drRows[rowIdx] : mlRows[rowIdx];
    const existingComment = row?._comments?.[colKey] || "";
    setCommentPopup({ table, rowIdx, colKey, x: e.clientX, y: e.clientY, value: existingComment });
  };

  const saveComment = () => {
    if (!commentPopup) return;
    const { table, rowIdx, colKey, value } = commentPopup;
    if (table === 'DR') {
      const newRows = [...drRows];
      newRows[rowIdx] = { ...newRows[rowIdx], _comments: { ...(newRows[rowIdx]._comments || {}), [colKey]: value } };
      if (!value) delete newRows[rowIdx]._comments[colKey];
      setDrRows(newRows);
    } else {
      const newRows = [...mlRows];
      newRows[rowIdx] = { ...newRows[rowIdx], _comments: { ...(newRows[rowIdx]._comments || {}), [colKey]: value } };
      if (!value) delete newRows[rowIdx]._comments[colKey];
      setMlRows(newRows);
    }
    setCommentPopup(null);
  };

  const handleNextStep = () => {
    if (!project.name) return toast.error("Project Name is required to proceed.");
    setViewMode('template-select');
  };

const handleTemplateSelect = (templateName: string) => {
    if (templateName && TEMPLATES[templateName]) {
      const tpl = TEMPLATES[templateName];
      setProject(p => ({ 
        ...p, 
        template: templateName,
        name: p.name || templateName,
        location: tpl.project.location,
        country: tpl.project.country,
        state: tpl.project.state,
        city: tpl.project.city
      }));

      let newMls: any[] = [];

      // Logic for "Pravachan at Yogi"
      if (templateName === "Pravachan at Yogi") {
        const yogiDetails = ["Pujya Gurudevshri's Entry", "Announcement", "Video :", "Mangalacharan", "Pravachan", "End Bhakti", "Arti", "Pujya Gurudevshri Blessing Mumukshus"];
        newMls = yogiDetails.map(detail => ({
          ...emptyMlRow,
          contentDetails: detail,
          timeOfDay: "Eve",
          contentLocation: "Yogi Sabhagruh",
          contentCountry: "India", contentState: "Maharashtra", contentCity: "Mumbai",
          editingStatus: "Unedited", footageType: "AS IT IS", dmCode: ""
        }));
      } 
      // Logic for "Satsang Shibir" (8 Step Sequence)
      else if (templateName === "Satsang Shibir") {
        const shibirDetails = ["Pujya Gurudevshri's Entry", "Announcement :", "Video : ", "Mangalacharan", "Pravachan 1", "End Bhakti", "Arti", "Pujya Gurudevshri Blessing Mumukshus"];
        newMls = shibirDetails.map(detail => ({
          ...emptyMlRow,
          contentDetails: detail,
          contentSpeaker: detail === "Pravachan 1" ? "Pujya Gurudevshri" : "",
          editingStatus: "Semi-Edited",
          footageType: "AS IT IS",
          contentCountry: "India", contentState: "Gujarat", contentCity: "Dharampur",
          dmCode: ""
        }));
      }
      // Logic for "Bapa Katha"
      else if (templateName === "Bapa Katha") {
        newMls = [{
          ...emptyMlRow,
          editingStatus: "Unedited",
          footageType: "AS IT IS - Camera",
          contentDetails: "Experience - ",
          contentSubDetails: "Approx Duration - ",
          contentCountry: "India", contentState: "Maharashtra", contentCity: "Mumbai",
          dmCode: ""
        }];
      } else {
        // Default for others
        newMls = tpl.dr.map((drTpl: any) => ({
          ...emptyMlRow,
          contentDetails: drTpl.folderName || "",
          contentLocation: tpl.project.location || "",
          contentCountry: tpl.project.country || "",
          contentState: tpl.project.state || "",
          contentCity: tpl.project.city || "",
          dmCode: ""
        }));
      }

      setDrRows([]); 
      setMlRows(recalculateMLSerials(newMls, project.autoEventCode)); 
    } else {
      setProject(p => ({ ...p, template: "" }));
      setDrRows([]);
      setMlRows([]);
    }
  };
const generateContCodes = () => {
    if (!project.contCodeType) return toast.error("Please select a Content Code Type");
    if (project.contCodeCount < 1) return toast.error("Count must be at least 1");
    
    const generatedCodes = generateContentCodes(project.contCodeType, project.contCodeCount);
    const newMls: any[] = [];

    // Sequences for templates
    const yogiDetails = ["Pujya Gurudevshri's Entry", "Announcement", "Video :", "Mangalacharan", "Pravachan", "End Bhakti", "Arti", "Pujya Gurudevshri Blessing Mumukshus"];
    const shibirDetails = ["Pujya Gurudevshri's Entry", "Announcement :", "Video : ", "Mangalacharan", "Pravachan 1", "End Bhakti", "Arti", "Pujya Gurudevshri Blessing Mumukshus"];
    const gmDetails = ["Announcements", "Paper and Exam Solving - ", "Playback Bhakti", "Sadguru Udghosh", "Pujya Gurudevshri Blessing Mumukshus"];

    generatedCodes.forEach((code) => {
      // --- NEW CASE: PRODUCTION SATSANG ---
      if (project.template === "Production Satsang") {
        newMls.push({
          ...emptyMlRow,
          dmCode: code,
          timeOfDay: "Morn",
          editingStatus: "Edited",
          footageType: "Extracted",
          contentDetails: "Sadguru Udghosh Extracted",
          segmentCategory: "SU - Extracted",
          contentSpeaker: "Pujya Gurudevshri Rakeshji",
          contentCountry: "India",
          contentState: "Gujarat",
          contentCity: "Dharampur",
          contentLocation: "Shrimad Rajchandra Ashram , Dharampur",
          topicGivenBy: "Pujya Gurudevshri",
          
        });
      }
      // CASE: GM
      else if (project.template === "GM") {
        gmDetails.forEach((detail) => {
          newMls.push({
            ...emptyMlRow,
            dmCode: code,
            timeOfDay: "Morn",
            editingStatus: "Semi-Edited",
            footageType: "AS IT IS",
            contentDetails: detail,
            segmentCategory: detail === "Sadguru Udghosh" ? "SU - GM" : "",
            contentSpeaker: detail === "Sadguru Udghosh" ? "Pujya Gurudevshri" : "",
            topicGivenBy: detail === "Sadguru Udghosh" ? "Pujya Gurudevshri" : "",
            contentCountry: "India",
            contentState: "Gujarat",
            contentCity: "Dharampur",
            contentLocation: "Shrimad Rajchandra Ashram , Dharampur"
          });
        });
      }
      // CASE: SADGURU UDGHOSH
      else if (project.template === "Sadguru Udghosh") {
        newMls.push({
          ...emptyMlRow,
          dmCode: code,
          timeOfDay: "Morn",
          editingStatus: "Edited",
          contentDetails: "Sadguru Udghosh",
          contentSubDetails: "Raj Sabhagruh",
          segmentCategory: "SU - Revision",
          contentSpeaker: "Pujya Gurudevshri Rakeshji",
          contentCountry: "India",
          contentState: "Gujarat",
          contentCity: "Dharampur",
          contentLocation: "Shrimad Rajchandra Ashram, Dharampur",
          topicGivenBy: "Pujya Gurudevshri"
        });
      }
      // CASE: SATSANG SHIBIR ... (Keep existing code)
      else if (project.template === "Satsang Shibir") {
        shibirDetails.forEach((detail) => {
          newMls.push({
            ...emptyMlRow,
            dmCode: code,
            timeOfDay: "Morn",
            contentDetails: detail,
            contentSpeaker: detail === "Pravachan 1" ? "Pujya Gurudevshri" : "",
            editingStatus: "Semi-Edited",
            footageType: "AS IT IS",
            contentLocation: "Shrimad Rajchandra Ashram, Dharampur",
            contentCountry: "India",
            contentState: "Gujarat",
            contentCity: "Dharampur"
          });
        });
      } 
      // CASE: BAPA KATHA ... (Keep existing code)
      else if (project.template === "Bapa Katha") {
        newMls.push({
          ...emptyMlRow,
          dmCode: code,
          editingStatus: "Unedited",
          footageType: "AS IT IS - Camera",
          contentDetails: "Experience - ",
          contentSubDetails: "Approx Duration - ",
          contentCountry: "India",
          contentState: "Maharashtra",
          contentCity: "Mumbai"
        });
      }
      // CASE: PRAVACHAN AT YOGI ... (Keep existing code)
      else if (project.template === "Pravachan at Yogi") {
        yogiDetails.forEach((detail) => {
          newMls.push({
            ...emptyMlRow,
            dmCode: code,
            contentDetails: detail,
            timeOfDay: "Eve",
            contentSpeaker: detail === "Pravachan" ? "Pujya Gurudevshri" : "",
            contentCountry: "India",
            contentState: "Maharashtra",
            contentCity: "Mumbai",
            contentLocation: "Yogi Sabhagruh",
            editingStatus: "Unedited",
            footageType: "AS IT IS"
          });
        });
      } 
      else {
        newMls.push({
          ...emptyMlRow,
          dmCode: code,
          contentLocation: project.location || "",
          contentCountry: project.country || "",
          contentState: project.state || "",
          contentCity: project.city || ""
        });
      }
    });

    setDrRows([]);
    setMlRows(recalculateMLSerials(newMls, project.autoEventCode));
    toast.success(`Project created with ${newMls.length} rows in ML Layer!`);
    setViewMode('editor');
    setIsProjectCreated(true);
  };
  // ==========================================
  // SCAN FOLDER LOGIC WITH MODAL YIELD FIX
  // ==========================================
// --- UPDATED METADATA EXTRACTOR ---
// --- UPDATED METADATA EXTRACTOR WITH FALLBACK LOGIC ---
const extractFolderMetadata = async (files: FileList): Promise<any[]> => {
  const scannedRows: any[] = [];
  
  const AUDIO_EXTENSIONS = {'.mp3': true, '.wav': true};
  const VIDEO_EXTENSIONS = {
    '.avi': true, '.mp4': true, '.mov': true, '.mxf': true, '.mkv': true,
    '.mpg': true, '.mts': true, '.2ts': true, '.peg': true, '.vob': true,
    '.m4v': true, '.m2t': true
  };
  
  const PHOTO_EXTENSIONS = {
    '.jpg': true, '.jpeg': true, '.png': true, '.gif': true, '.bmp': true,
    '.tif': true, '.tiff': true, '.heic': true, '.webp': true
  };

  // Group files by folder
  const folderMap = new Map<string, File[]>();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.name.startsWith('.') || file.name.toLowerCase() === 'desktop.ini') continue;
    // @ts-ignore
    const webkitPath = file.webkitRelativePath || '';
    const folderPath = webkitPath ? webkitPath.substring(0, webkitPath.lastIndexOf('/')) : 'Scanned Directory';
    if (!folderMap.has(folderPath)) folderMap.set(folderPath, []);
    folderMap.get(folderPath)!.push(file);
  }

  let srNo = 1;
  for (const [folderPath, filesInFolder] of folderMap) {
    const folderName = folderPath.split('/').pop() || folderPath;
    const subFolders = folderPath.split('/').filter(f => f);
    
    // 1. Identify "Primary File" for metadata analysis
    const primaryFile = filesInFolder.find(f => {
        const ext = ('.' + f.name.split('.').pop()?.toLowerCase());
        return ext in VIDEO_EXTENSIONS || ext in AUDIO_EXTENSIONS;
    }) || filesInFolder[0];

    const fileNameOnly = primaryFile ? primaryFile.name : folderName;

    // --- NEW: FETCH BITRATES AND DURATION ---
    let detectedVBitrate = "";
    let detectedABitrate = "";
    let detectedDuration = "";

    if (primaryFile) {
        const ext = ('.' + primaryFile.name.split('.').pop()?.toLowerCase());
        const isVideo = ext in VIDEO_EXTENSIONS;
        const isAudio = ext in AUDIO_EXTENSIONS;

        // Calls your existing extractMediaMetadata function
        const meta = await extractMediaMetadata(primaryFile, isVideo, isAudio);
        detectedVBitrate = meta.vBitrate; 
        detectedABitrate = meta.aBitrate; 
        detectedDuration = meta.duration;
    }
    // ----------------------------------------

    // Existing Digital Code Priority Logic
    let drCode = extractDigitalCode(fileNameOnly);
    if (!drCode) drCode = extractDigitalCode(folderName);

    let totalFiles = 0;
    let totalSize = 0;
    const formats = new Set<string>();
    let hasVideo = false;
    let hasAudio = false;
    let hasPhoto = false;
    let masterQualityDetected = "";

    // 2. Process all files in group
    for (const file of filesInFolder) {
      totalFiles++;
      totalSize += file.size;
      const ext = ('.' + file.name.split('.').pop()?.toLowerCase()).toLowerCase();
      
      if (ext in PHOTO_EXTENSIONS) {
        formats.add(ext.toUpperCase().slice(1));
        hasPhoto = true;
      } else if (ext in AUDIO_EXTENSIONS) {
        formats.add(ext.toUpperCase().slice(1));
        hasAudio = true;
      } else if (ext in VIDEO_EXTENSIONS) {
        formats.add(ext === '.2ts' ? '2TS' : ext.toUpperCase().slice(1));
        hasVideo = true;
      }

      // CHANGE THIS LINE: Pass drCode (or fileName if code missing) to the helper
      const mq = determineMasterQuality(drCode || fileNameOnly, hasPhoto);
      if (mq && !masterQualityDetected) masterQualityDetected = mq;
    }

    const formatSummary = formats.size > 1 ? 'MULTIPLE' : (formats.size === 1 ? Array.from(formats)[0] : 'N/A');

     const row = {
      ...emptyDrRow,
      srNo: srNo.toString(),
      folderName: subFolders[0] || folderName,
      subFolder1: subFolders[1] || '',
      subFolder2: subFolders[2] || '',
      dmFolderFileName: fileNameOnly, 
      noOfFiles: totalFiles.toString(),
      formatType: formatSummary,

      // --- POPULATE BITRATES & DURATION ---
      videoBitrate: detectedVBitrate, 
      audioBitrate: detectedABitrate, 
      duration: detectedDuration,
      // ------------------------------------

      fileSizeBytes: totalSize.toString(),
      fileSizeGb: (totalSize / (1024 ** 3)).toFixed(2),
      visibleFilesize: formatBytes(totalSize),
      filePath: folderPath,
      dmCode: drCode || fileNameOnly, 
      masterQuality: masterQualityDetected || (hasVideo ? "Video" : hasAudio ? "Audio" : ""),
      _comments: {}
    };

    scannedRows.push(row);
    srNo++;
  }

  return scannedRows;
};
const handleFolderScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  // Switch to DR tab to show the results
  setActiveTab('DR');
  setIsScanning(true);
  
  try {
    const scannedRows = await extractFolderMetadata(files);
    
    if (scannedRows.length > 0) {
      // 1. Update DR rows ONLY
      setDrRows(prev => {
        const updated = [...prev, ...scannedRows];
        return updated.map((row, idx) => ({ ...row, srNo: (idx + 1).toString() }));
      });

      // --- LOGIC REMOVED FROM HERE ---
      // We no longer generate newMlRows and call setMlRows here.
      // This ensures the ML layer is not affected by the folder scan.
      
      toast.success(`Scanned ${scannedRows.length} folders into DR Layer!`);
    }
  } catch (error) {
    toast.error('Error scanning folder');
  } finally {
    setIsScanning(false);
  }
};

  const addDrRow = () => setDrRows([...drRows, {...emptyDrRow, dmCode: generateCode('DR-', 4)}]);
const addMlRow = () => {
    let autoFilledFields = {};
    const lastRow = mlRows.length > 0 ? mlRows[mlRows.length - 1] : null;

    if (project.template === "Production Satsang") {
      autoFilledFields = {
        timeOfDay: "Morn",
        editingStatus: "Edited",
        footageType: "Extracted",
        contentDetails: "Sadguru Udghosh Extracted",
        segmentCategory: "SU - Extracted",
        contentSpeaker: "Pujya Gurudevshri Rakeshji",
        contentCountry: "India",
        contentState: "Gujarat",
        contentCity: "Dharampur",
        contentLocation: "Shrimad Rajchandra Ashram, Dharampur",
        topicGivenBy: "Pujya Gurudevshri",
       
        dmCode: lastRow ? lastRow.dmCode : ""
      };
    }
    else if (project.template === "GM") {
      const gmDetails = ["Announcements", "Paper and Exam Solving - ", "Playback Bhakti", "Sadguru Udghosh", "Pujya Gurudevshri Blessing Mumukshus"];
      const nextIndex = mlRows.length % gmDetails.length;
      const currentDetail = gmDetails[nextIndex];
      autoFilledFields = {
        timeOfDay: "Morn",
        editingStatus: "Semi-Edited",
        footageType: "AS IT IS",
        contentDetails: currentDetail,
        segmentCategory: currentDetail === "Sadguru Udghosh" ? "SU - GM" : "",
        contentSpeaker: currentDetail === "Sadguru Udghosh" ? "Pujya Gurudevshri" : "",
        topicGivenBy: currentDetail === "Sadguru Udghosh" ? "Pujya Gurudevshri" : "",
        contentCountry: "India",
        contentState: "Gujarat",
        contentCity: "Dharampur",
        contentLocation: "Shrimad Rajchandra Ashram, Dharampur",
        dmCode: lastRow ? lastRow.dmCode : ""
      };
    }
    else if (project.template === "Sadguru Udghosh") {
      autoFilledFields = {
        timeOfDay: "Morn",
        editingStatus: "Edited",
        contentDetails: "Sadguru Udghosh",
        contentSubDetails: "Raj Sabhagruh",
        segmentCategory: "SU - Revision",
        contentSpeaker: "Pujya Gurudevshri Rakeshji",
        contentCountry: "India",
        contentState: "Gujarat",
        contentCity: "Dharampur",
        contentLocation: "Shrimad Rajchandra Ashram, Dharampur",
        topicGivenBy: "Pujya Gurudevshri",
        dmCode: lastRow ? lastRow.dmCode : ""
      };
    }
    else if (project.template === "Satsang Shibir") {
      const shibirDetails = ["Pujya Gurudevshri's Entry", "Announcement :", "Video : ", "Mangalacharan", "Pravachan 1", "End Bhakti", "Arti", "Pujya Gurudevshri Blessing Mumukshus"];
      const nextIndex = mlRows.length % shibirDetails.length;
      const currentDetail = shibirDetails[nextIndex];
      autoFilledFields = {
        timeOfDay: "Morn",
        contentDetails: currentDetail,
        contentSpeaker: currentDetail === "Pravachan 1" ? "Pujya Gurudevshri" : "",
        editingStatus: "Semi-Edited",
        footageType: "AS IT IS",
        contentLocation: "Shrimad Rajchandra Ashram, Dharampur",
        contentCountry: "India", contentState: "Gujarat", contentCity: "Dharampur",
        dmCode: lastRow ? lastRow.dmCode : ""
      };
    } 
    else if (project.template === "Bapa Katha") {
      autoFilledFields = {
        editingStatus: "Unedited",
        footageType: "AS IT IS - Camera",
        contentDetails: "Experience - ",
        contentSubDetails: "Approx Duration - ",
        contentCountry: "India", contentState: "Maharashtra", contentCity: "Mumbai",
        dmCode: lastRow ? lastRow.dmCode : ""
      };
    }
    else if (project.template === "Pravachan at Yogi") {
      const yogiDetails = ["Pujya Gurudevshri's Entry", "Announcement", "Video :", "Mangalacharan", "Pravachan", "End Bhakti", "Arti", "Pujya Gurudevshri Blessing Mumukshus"];
      const nextIndex = mlRows.length % yogiDetails.length;
      autoFilledFields = {
        contentDetails: yogiDetails[nextIndex],
        timeOfDay: "Eve",
        contentSpeaker: yogiDetails[nextIndex] === "Pravachan" ? "Pujya Gurudevshri" : "",
        contentLocation: "Yogi Sabhagruh",
        contentCountry: "India", contentState: "Maharashtra", contentCity: "Mumbai",
        editingStatus: "Semi-Edited", footageType: "AS IT IS",
        dmCode: lastRow ? lastRow.dmCode : ""
      };
    } else {
      autoFilledFields = {
        contentLocation: project.location || "",
        contentCountry: project.country || "",
        contentState: project.state || "",
        contentCity: project.city || "",
        dmCode: lastRow ? lastRow.dmCode : ""
      };
    }

    const newRow = { ...emptyMlRow, ...autoFilledFields, eventCode: project.autoEventCode };
    setMlRows(prev => recalculateMLSerials([...prev, newRow], project.autoEventCode));
  };
  const removeDrRow = (index: number) => setDrRows(drRows.filter((_, i) => i !== index));
  const removeMlRow = (index: number) => setMlRows(prev => recalculateMLSerials(prev.filter((_, i) => i !== index), project.autoEventCode));

  const updateDr = (index: number, field: string, value: string) => {
  const updated = [...drRows];
  updated[index][field] = value;

  // NEW LOGIC: If Digital Code is changed, automatically update Master Quality
  if (field === 'dmCode') {
    const isPhoto = value.toUpperCase().startsWith('P');
    updated[index].masterQuality = determineMasterQuality(value, isPhoto);
  }

  setDrRows(updated);
};

 const updateMl = (index: number, field: string, value: string) => {
  let updated = [...mlRows];
  updated[index][field] = value;

  // 1. AUTOMATIC DURATION CALCULATION
  if (field === 'counterFrom' || field === 'counterTo') {
    const duration = calculateDuration(updated[index].counterFrom, updated[index].counterTo);
    updated[index].subDuration = duration;
    updated[index].totalDuration = duration; // Syncing both duration fields
  }

  // 2. AUTOMATIC LOW RES DURATION
  if (field === 'lowResCounterFrom' || field === 'lowResCounterTo') {
    updated[index].lowResTotalDuration = calculateDuration(updated[index].lowResCounterFrom, updated[index].lowResCounterTo);
  }

  // 3. AUTOMATIC ID & SERIAL RECALCULATION
  // We trigger this if the DM Code changes to ensure the .001, .002 logic stays correct
  if (field === 'dmCode') {
    updated = recalculateMLSerials(updated, project.autoEventCode);
  }

  setMlRows(updated);
};
  const renderInput = (label: string, val: string, setter: (v: string)=>void, type="text", span="auto", disabled=false) => (
    <div style={{ ...styles.inputWrapper, gridColumn: span }}>
      <span style={styles.label}>{label}</span>
      <input type={type} value={val} disabled={disabled} onChange={e => setter(e.target.value)} style={{...styles.input, opacity: disabled ? 0.6 : 1}} />
    </div>
  );

const renderTableCell = (tableType: 'DR' | 'ML', col: any, row: any, idx: number, onChange: (i: number, f: string, v: string) => void) => {
    const isDraggingThisCol = dragState?.currentCol === col.key && dragState?.table === tableType;
    const minRow = dragState ? Math.min(dragState.startRow, dragState.currentRow) : -1;
    const maxRow = dragState ? Math.max(dragState.startRow, dragState.currentRow) : -1;
    const isHighlighted = isDraggingThisCol && idx >= minRow && idx <= maxRow;

    // Base style for all cells
    let inputStyle: any = { 
      ...styles.cellInput, 
      ...col.styling,
      width: "100%",
      backgroundColor: isHighlighted ? "rgba(59, 130, 246, 0.2)" : "transparent",
      outline: isHighlighted ? "1px solid #3b82f6" : "none",
      opacity: col.disabled ? 0.6 : 1,
    };

    // Style for dropdowns to look like Excel cells
    const selectStyle = {
      ...inputStyle,
      appearance: "none",
      cursor: "pointer",
      textAlign: "center" as "center",
      color: row[col.key] ? "#fff" : "#94a3b8"
    };

    // Duration Color Coding
    if (['subDuration', 'totalDuration', 'lowResTotalDuration'].includes(col.key) && row[col.key]) {
      if (row[col.key] === 'Invalid') { inputStyle.color = '#ef4444'; inputStyle.fontWeight = 600; }
      else if (row[col.key] !== '00:00:00') { inputStyle.color = '#10b981'; inputStyle.fontWeight = 600; }
    }

    let inputElement;

    // Handle Dropdowns
    if (col.type === "dr-select" || col.type === "select") {
      const options = col.type === "dr-select" 
        ? drRows.filter(dr => dr.dmCode).map(dr => ({ value: dr.dmCode, label: dr.dmCode }))
        : col.options.map((opt: string) => ({ value: opt, label: opt }));

      inputElement = (
        <select 
          value={row[col.key]} 
          disabled={col.disabled} 
          onChange={e => onChange(idx, col.key, e.target.value)} 
          style={selectStyle}
        >
          <option value="" style={{color: "black"}}>-- Select --</option>
          {options.map((item: any) => (
            <option key={item.value} value={item.value} style={{color: "black"}}>{item.label}</option>
          ))}
        </select>
      );
    } 
    // Handle Standard Inputs
    else {
      inputElement = (
        <input 
          type={col.type || "text"}
          value={row[col.key] || ""}
          disabled={col.disabled}
          placeholder={col.placeholder || ""}
          onChange={e => onChange(idx, col.key, e.target.value)}
          style={inputStyle}
        />
      );
    }

    const comment = row._comments?.[col.key];

    return (
      <div 
        style={{ position: "relative", width: "100%", height: "100%", minHeight: "38px" }}
        onContextMenu={(e) => handleContextMenu(e, tableType, idx, col.key)}
        onMouseEnter={() => { if (dragState && dragState.table === tableType) setDragState(p => p ? { ...p, currentRow: idx } : null); }}
      >
        {inputElement}
        {comment && (<div title={comment} style={{ position: "absolute", top: 0, right: 0, borderTop: "8px solid #ef4444", borderLeft: "8px solid transparent", pointerEvents: "none" }} />)}
        
        {/* The Drag Fill Handle (Blue Square) */}
        {!col.disabled && (
          <div 
            onMouseDown={(e) => { 
                e.preventDefault(); 
                e.stopPropagation();
                setDragState({ table: tableType, startRow: idx, currentRow: idx, currentCol: col.key, startValue: row[col.key] }); 
            }}
            onDoubleClick={() => handleDoubleClickFill(tableType, idx, col.key, row[col.key])}
            style={{
              position: "absolute", bottom: 2, right: 2, width: 8, height: 8, 
              backgroundColor: "#3b82f6", cursor: "crosshair", zIndex: 10,
              border: "1px solid white",
              display: (row[col.key] || isHighlighted) ? "block" : "none"
            }}
          />
        )}
      </div>
    );
  };

  const rowMatchesSearch = (row: any, term: string) => {
    if (!term) return true;
    const lowerTerm = term.toLowerCase();
    return Object.values(row).some(val => String(val).toLowerCase().includes(lowerTerm));
  };

  // ==========================================
  // RENDER: DASHBOARD LIST VIEW
  // ==========================================
  if (viewMode === 'list') {
    return (
      <div style={styles.wrapper} className="custom-scrollbar animate-in fade-in zoom-in-95 duration-300">
        <div style={styles.header}>
          <button onClick={onBack} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}><ArrowLeft size={18} /></button>
          <h2 style={{ fontSize: "1.5rem", margin: 0, fontWeight: "bold" }}>Submission Library</h2>
          <div style={{ marginLeft: "auto" }}>
            <button onClick={handleStartNewProject} style={styles.buttonPrimary}><Plus size={18}/> Create New Project</button>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={{ margin: "0 0 20px 0", color: "#94a3b8", display: "flex", alignItems: "center", gap: 8 }}>
            <Layers size={18}/> Your Saved Projects
          </h3>
          
          <div style={styles.tableWrapper} className="custom-scrollbar">
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{...styles.th, padding: "12px 16px"}}>Project Name</th>
                  <th style={{...styles.th, padding: "12px 16px"}}>Auto Event Code</th>
                  <th style={{...styles.th, padding: "12px 16px"}}>Assignee</th>
                  <th style={{...styles.th, padding: "12px 16px"}}>Date Created</th>
                  <th style={{...styles.th, padding: "12px 16px"}}>Submission Status</th>
                  <th style={{...styles.th, padding: "12px 16px", textAlign: "right"}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedProjects.map((proj) => (
                  <tr key={proj.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.2s" }} className="hover:bg-white/5">
                    <td style={{...styles.td, padding: "12px 16px", fontWeight: "bold", color: "#fff"}}>{proj.metadata.name || "Untitled Project"}</td>
                    <td style={{...styles.td, padding: "12px 16px", color: "#3b82f6"}}>{proj.metadata.autoEventCode}</td>
                    <td style={{...styles.td, padding: "12px 16px", color: "#94a3b8"}}>
  <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
    {proj.metadata.assignee ? proj.metadata.assignee.split(", ").map((name: string) => {
      // Find user data to get avatar image if it exists
      const avatarColors = ['#ef7a44', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
      const userData = availableUsers.find(u => u.name === name);
      const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
      
      // Select a consistent color based on the name string
      const colorIndex = name.length % avatarColors.length;
      const bgColor = avatarColors[colorIndex];

      return (
        <div key={name} title={name} style={{ display: 'flex' }}>
          <Avatar style={{ height: 26, width: 26, border: "2px solid #0f172a" }}>
            <AvatarImage src={userData?.avatar} />
            <AvatarFallback style={{ 
              fontSize: '10px', 
              fontWeight: 'bold', 
              background: bgColor, 
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%'
            }}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      );
    }) : (
      <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Unassigned</span>
    )}
  </div>
</td>
                    <td style={{...styles.td, padding: "12px 16px", color: "#94a3b8"}}>{proj.metadata.dateCreated || "—"}</td>
                    <td style={{...styles.td, padding: "12px 16px"}}>
                      <span style={{ background: "rgba(16, 185, 129, 0.2)", color: "#10b981", padding: "4px 12px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 600 }}>Draft</span>
                    </td>
                   
                    <td style={{...styles.td, padding: "12px 16px", textAlign: "right"}}>
                      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                        <button onClick={(e) => handlePushToDB(e, proj)} style={{ background: "rgba(16, 185, 129, 0.2)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.5)", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", fontWeight: 600 }}>
                          <Database size={14}/> Push to DB
                        </button>
                        <button onClick={() => handleOpenProject(proj)} style={{ background: "rgba(59, 130, 246, 0.2)", color: "#3b82f6", border: "1px solid rgba(59, 130, 246, 0.5)", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", fontWeight: 600 }}>
                          <Edit size={14}/> Open Project
                        </button>
                        <button onClick={(e) => handleDeleteProject(e, proj.id)} style={{ background: "transparent", color: "#ef4444", border: "none", padding: "6px", cursor: "pointer" }}>
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {savedProjects.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                      <FolderOpen size={32} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                      No projects saved yet. Click "Create New Project" to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: PROJECT CREATION FLOW (STEP 1)
  // ==========================================
  if (viewMode === 'editor' && !isProjectCreated) {
    return (
      <div style={styles.wrapper} className="custom-scrollbar animate-in fade-in zoom-in-95 duration-300">
       <style>
      {`
        /* Target the calendar icon specifically */
        input[type="date"]::-webkit-calendar-picker-indicator {
         
          cursor: pointer;
          padding: 5px;
          border-radius: 3px;
          transition: background 0.2s;
        }

        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          
        }
      `}
    </style>
        <div style={styles.header}>
          <button onClick={() => setViewMode('list')} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}><ArrowLeft size={18} /></button>
          <h2 style={{ fontSize: "1.5rem", margin: 0, fontWeight: "bold" }}>Create New Project</h2>
        </div>

        <div style={styles.section}>
          <h3 style={{ margin: "0 0 20px 0", color: "#fff" }}>Step 1: Project Details</h3>
          <div style={styles.grid}>
            {renderInput("Name", project.name, v => setProject({...project, name: v}), "text", "span 2")}
            {renderInput("Auto Event Code", project.autoEventCode, () => {}, "text", "auto", true)}
            {renderAssigneePicker()}
            {renderInput("Date Created", project.dateCreated, () => {}, "text", "auto", true)}
            {renderInput("Submitter's Deadline", project.submitterDeadline, v => setProject({...project, submitterDeadline: v}), "date", "auto")}
            {renderInput("Event From", project.eventFrom, v => setProject({...project, eventFrom: v}), "date", "auto")}
            {renderInput("Event To", project.eventTo, v => setProject({...project, eventTo: v}), "date", "auto")}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button onClick={handleNextStep} style={styles.buttonPrimary}>Next: Select Template</button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: TEMPLATE SELECTION (STEP 2)
  // ==========================================
  if (viewMode === 'template-select') {
    const selectedCodeType = CONTENT_CODE_TYPES.find(t => t.value === project.contCodeType);
    
    return (
     <div>
  {/* Scrollbar Hide + Smooth UX */}
  <style>
    {`
      /* Hide scrollbar */
      .custom-scrollbar::-webkit-scrollbar {
        width: 0px;
        height: 0px;
      }

      .custom-scrollbar {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
    `}
  </style>

  <div
    style={{
      ...styles.wrapper,
      overflowY: "auto",
      scrollBehavior: "smooth"
    }}
    className="custom-scrollbar animate-in fade-in zoom-in-95 duration-300"
  >
    <div style={styles.header}>
      <button
        onClick={() => setViewMode('editor')}
        style={{
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "50%",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          cursor: "pointer"
        }}
      >
        <ArrowLeft size={18} />
      </button>

      <h2 style={{ fontSize: "1.5rem", margin: 0, fontWeight: "bold" }}>
        Configure Project
      </h2>
    </div>

    <div style={styles.section}>
      <h3 style={{ margin: "0 0 20px 0", color: "#fff" }}>
        Step 2: Select Template & Content Code Type
      </h3>

      <div style={{ ...styles.grid, marginBottom: "20px" }}>
        {/* Template */}
        <div style={styles.inputWrapper}>
          <span style={styles.label}>Template Type</span>

          <select
            value={project.template}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            style={{
              ...styles.input,
              cursor: "pointer",
              backgroundColor: "#1e293b",
              color: "#e1edf1",
              border: "1px solid #55585fc4"
            }}
          >
            <option value="">-- Select Template --</option>
            {Object.keys(TEMPLATES).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Content Code Type */}
        <div style={styles.inputWrapper}>
          <span style={styles.label}>Cont Code Type</span>

          <select
            value={project.contCodeType}
            onChange={(e) =>
              setProject({ ...project, contCodeType: e.target.value })
            }
            style={{
              ...styles.input,
              cursor: "pointer",
              backgroundColor: "#1e293b",
              color: "#e0e9ec",
              border: "1px solid #474749b6"
            }}
          >
            <option value="">-- Select Cont Code Type --</option>
            {CONTENT_CODE_TYPES.map(cct => (
              <option key={cct.value} value={cct.value}>
                {cct.label}
              </option>
            ))}
          </select>
        </div>

        {/* Number Input */}
        <div style={styles.inputWrapper}>
          <span style={styles.label}>Number of Codes to Generate</span>

          <input
            type="number"
            value={project.contCodeCount}
            onChange={(e) =>
              setProject({
                ...project,
                contCodeCount: Math.max(
                  1,
                  parseInt(e.target.value) || 1
                )
              })
            }
            style={{
              ...styles.input,
              backgroundColor: "#1e293b",
              color: "#e0e9ec",
              border: "1px solid #474749b6",
              outline: "none"
            }}
          />
        </div>
      </div>

      {/* Summary */}
      {selectedCodeType && (
        <div
          style={{
            background: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "20px"
          }}
        >
          <p
            style={{
              margin: "0 0 8px 0",
              color: "#3b82f6",
              fontWeight: 600,
              fontSize: "0.9rem"
            }}
          >
            📊 Cont Code Summary
          </p>

          <div style={{ color: "#e2e8f0", fontSize: "0.85rem" }}>
            <p style={{ margin: "0 0 6px 0" }}>
              <span style={{ color: "#3b82f6", fontWeight: 600 }}>
                Type:
              </span>{" "}
              {selectedCodeType.label}
            </p>

            <p style={{ margin: 0 }}>
              <span style={{ color: "#3b82f6", fontWeight: 600 }}>
                Total Generating:
              </span>{" "}
              {project.contCodeCount} code(s)
              {project.template && (
                <span>
                  {" "}from template{" "}
                  <span style={{ color: "#a855f7", fontWeight: 600 }}>
                    {project.template}
                  </span>
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          marginTop: 20
        }}
      >
        <button
          onClick={() => setViewMode('editor')}
          style={{ ...styles.buttonSecondary }}
        >
          Back
        </button>

        {project.contCodeType && (
          <button
            onClick={generateContCodes}
            style={styles.buttonSuccess}
          >
            Generate Codes & Create Project
          </button>
        )}
      </div>
    </div>
  </div>
</div>
    );
  }

  // ==========================================
  // RENDER: EDITOR VIEW (THE ACTUAL FORM) - EXISTING CODE
  // ==========================================
  const visibleDrRowsCount = drRows.filter(r => rowMatchesSearch(r, drSearch)).length;
  const visibleMlRowsCount = mlRows.filter(r => rowMatchesSearch(r, mlSearch)).length;

  return (
    <div style={styles.wrapper} className="custom-scrollbar animate-in slide-in-from-right-8 duration-300">
<style>
{`
  input[type="date"] {
    color: #fff;
    background-color: transparent;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'/%3E%3Cpath d='M3 10h18'/%3E%3Cpath d='M16 2v4'/%3E%3Cpath d='M8 2v4'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 18px 18px;
    padding-right: 38px;
    -webkit-appearance: none;
    appearance: none;
  }

  input[type="date"]::-webkit-calendar-picker-indicator {
    opacity: 0;
  }

  input[type="date"]::-moz-calendar-picker-indicator,
  input[type="date"]::-ms-clear,
  input[type="date"]::-ms-expand {
    display: none;
  }
`}
</style>
      {/* BEAUTIFUL PROCESSING / SCANNING MODAL */}
      {isScanning && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-in fade-in zoom-in-95 duration-300" style={{ background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))', border: '1px solid rgba(59, 130, 246, 0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 40px rgba(59, 130, 246, 0.1)', borderRadius: '16px', padding: '40px', width: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <Loader2 size={50} color="#3b82f6" className="animate-spin" />
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '1.25rem', fontWeight: 600 }}>Analyzing Media</h3>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>Extracting bitrates and durations...</p>
              {scannedCount > 0 && <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600 }}>Processed {scannedCount} files</div>}
            </div>
          </div>
        </div>
      )}

      {/* BEAUTIFUL CELL COMMENT POPUP */}
      {commentPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }} onMouseDown={() => saveComment()}>
          <div className="animate-in fade-in zoom-in-95 duration-200" onMouseDown={e => e.stopPropagation()} style={{ position: 'absolute', top: commentPopup.y, left: commentPopup.x, background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', width: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <MessageSquare size={14} color="#3b82f6" />
              <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: '600' }}>Cell Note</span>
            </div>
            <textarea autoFocus value={commentPopup.value} onChange={e => setCommentPopup(p => p ? { ...p, value: e.target.value } : null)} placeholder="Type your comment here..." style={{ width: '100%', height: '80px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(59,130,246,0.5)', color: '#fff', borderRadius: '6px', padding: '10px', outline: 'none', fontSize: '0.85rem', resize: 'none', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', gap: '10px' }}>
              <button onClick={() => setCommentPopup(p => p ? { ...p, value: "" } : null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>Clear</button>
              <button onClick={saveComment} style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>Save Note</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={() => setViewMode('list')} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}><ArrowLeft size={18} /></button>
        <h2 style={{ fontSize: "1.5rem", margin: 0, fontWeight: "bold" }}>Editing Project</h2>
        {isProjectCreated && <div style={{ marginLeft: "auto" }}><button onClick={submitEntireProject} style={styles.buttonSuccess}><Save size={18}/> Save to Dashboard</button></div>}
      </div>

      <div style={{...styles.section, border: isProjectCreated ? "1px solid rgba(16, 185, 129, 0.4)" : styles.section.border}}>
        <div style={styles.headerRow}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: isProjectCreated ? "#10b981" : "#fff" }}><Layers size={18}/> 1. Project Metadata {isProjectCreated && <CheckCircle2 size={16} color="#10b981"/>}</h3>
          {showTemplateSelect && !isProjectCreated && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300">
              <select
  value={project.contCodeType}
  onChange={(e) => setProject({...project, contCodeType: e.target.value})}
  style={{
    ...styles.input,
    cursor: "pointer",
    backgroundColor: "#1e293b",
    color: "#38bdf8",
    border: "1px solid #38bdf8"
  }}
>
                <option value="">-- Apply Standard Template (Optional) --</option>
                <option value="Sadguru Udghosh">Sadguru Udghosh</option>
                <option value="Pravachan Series">Pravachan Series</option>
              </select>
            </div>
          )}
        </div>
        <div style={styles.grid}>
          {renderInput("Name", project.name, v => setProject({...project, name: v}), "text", "span 2", isProjectCreated)}
          {renderInput("Event Code (Auto)", project.autoEventCode, () => {}, "text", "auto", true)}
         {renderInput(
  "Submitter's deadline",
  project.submitterDeadline,
  v => setProject({ ...project, submitterDeadline: v }),
  "date",
  "auto",
  isProjectCreated
)}
          {renderInput("Event Date From", project.eventFrom, val => setProject({...project, eventFrom: val}), "date", "auto", isProjectCreated)}
          {renderInput("Event Date To", project.eventTo, val => setProject({...project, eventTo: val}), "date", "auto", isProjectCreated)}
         
        
          
        </div>
        {!isProjectCreated && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            {!showTemplateSelect ? <button onClick={() => { setShowTemplateSelect(true); }} style={styles.buttonPrimary}>Next: Select Template</button> : <button onClick={() => { setIsProjectCreated(true); }} style={styles.buttonSuccess}>Confirm & Create Project</button>}
          </div>
        )}
      </div>

      {isProjectCreated && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
          
          {/* TAB SWITCHER */}
          <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' }}>
            <button 
              onClick={() => setActiveTab('DR')}
              style={{
                background: 'transparent', border: 'none', 
                borderBottom: activeTab === 'DR' ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === 'DR' ? '#fff' : '#94a3b8',
                padding: '10px 16px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
              }}
            >
              <FileAudio size={18} /> DR Layer ({drRows.length})
            </button>
            <button 
              onClick={() => setActiveTab('ML')}
              style={{
                background: 'transparent', border: 'none', 
                borderBottom: activeTab === 'ML' ? '2px solid #a855f7' : '2px solid transparent',
                color: activeTab === 'ML' ? '#fff' : '#94a3b8',
                padding: '10px 16px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
              }}
            >
              <FileText size={18} /> ML Layer ({mlRows.length})
            </button>
          </div>

          {/* DR LAYER SECTION */}
          {activeTab === 'DR' && (
            <div style={styles.section} className="animate-in fade-in duration-300">
              <div style={styles.headerRow}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><FileAudio size={18}/> Master Media Files</h3>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  
                  {/* DR SEARCH BAR */}
                  <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0 10px', height: '36px' }}>
                    <Search size={16} color="#94a3b8" />
                    <input 
                      type="text" 
                      placeholder="Search DR layer..." 
                      value={drSearch} 
                      onChange={(e) => setDrSearch(e.target.value)} 
                      style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', paddingLeft: '8px', fontSize: '0.85rem', width: '200px' }}
                    />
                  </div>

                  <input type="file" ref={fileInputRef} multiple style={{ display: "none" }} onChange={handleFolderScan} 
                    // @ts-ignore
                    webkitdirectory="" directory=""
                  />
                  <button onClick={() => fileInputRef.current?.click()} 
                    style={{...styles.buttonSecondary, opacity: isScanning ? 0.7 : 1, pointerEvents: isScanning ? 'none' : 'auto'}}>
                    {isScanning ? <Loader2 className="animate-spin" size={16}/> : <FolderOpen size={16}/>} 
                    {isScanning ? "Scanning..." : "Scan Folder"}
                  </button>
                  <button onClick={addDrRow} style={styles.buttonPrimary}><Plus size={16}/> Add DR Row</button>
                </div>
              </div>
              <div style={{...styles.tableWrapper, userSelect: dragState ? "none" : "auto"}} className="custom-scrollbar">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{...styles.th, width: 40, padding: "10px"}}></th>
                      <th style={{...styles.th, width: 40, padding: "10px", textAlign: "center"}}>No.</th>
                      {DR_COLUMNS.map(col => (
                        <th key={col.key} style={{...styles.th, padding: 0}}>
                          <div style={{ resize: "horizontal", overflow: "hidden", padding: "10px", width: col.styling?.width || "160px", minWidth: "80px", whiteSpace: "nowrap", boxSizing: "border-box" }}>{col.label}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {drRows.map((row, idx) => {
                      const isMatch = rowMatchesSearch(row, drSearch);
                      return (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)", display: isMatch ? "table-row" : "none" }}>
                          <td style={{...styles.td, textAlign: 'center'}}><button onClick={() => removeDrRow(idx)} style={{background:'transparent', border:'none', color:'#ef4444', cursor:'pointer'}}><Trash2 size={14}/></button></td>
                          <td style={{...styles.td, textAlign: 'center', color: '#94a3b8'}}>{idx + 1}</td>
                          {DR_COLUMNS.map(col => <td key={col.key} style={styles.td}>{renderTableCell('DR', col, row, idx, updateDr)}</td>)}
                        </tr>
                      );
                    })}
                    {drRows.length === 0 && <tr><td colSpan={DR_COLUMNS.length + 2} style={{textAlign: 'center', padding: '20px', color: '#64748b'}}>No records added. Scan a folder, apply a template, or click 'Add DR Row'.</td></tr>}
                    {drRows.length > 0 && visibleDrRowsCount === 0 && <tr><td colSpan={DR_COLUMNS.length + 2} style={{textAlign: 'center', padding: '20px', color: '#64748b'}}>No records found matching "{drSearch}".</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ML LAYER SECTION */}
          {activeTab === 'ML' && (
            <div style={styles.section} className="animate-in fade-in duration-300">
              <div style={styles.headerRow}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18}/> Media Logs</h3>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  
                  {/* ML SEARCH BAR */}
                  <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0 10px', height: '36px' }}>
                    <Search size={16} color="#94a3b8" />
                    <input 
                      type="text" 
                      placeholder="Search Event, Speaker, Topic..." 
                      value={mlSearch} 
                      onChange={(e) => setMlSearch(e.target.value)} 
                      style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', paddingLeft: '8px', fontSize: '0.85rem', width: '250px' }}
                    />
                  </div>

                  <button onClick={addMlRow} style={styles.buttonPrimary}><Plus size={16}/> Add ML Row</button>
                </div>
              </div>
              <div style={{...styles.tableWrapper, userSelect: dragState ? "none" : "auto"}} className="custom-scrollbar">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{...styles.th, width: 40, padding: "10px"}}></th>
                      {ML_COLUMNS.map(col => (
                        <th key={col.key} style={{...styles.th, padding: 0}}>
                          <div style={{ resize: "horizontal", overflow: "hidden", padding: "10px", width: col.styling?.width || "160px", minWidth: "80px", whiteSpace: "nowrap", boxSizing: "border-box" }}>{col.label}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mlRows.map((row, idx) => {
                      const isMatch = rowMatchesSearch(row, mlSearch);
                      return (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)", display: isMatch ? "table-row" : "none" }}>
                          <td style={{...styles.td, textAlign: 'center'}}><button onClick={() => removeMlRow(idx)} style={{background:'transparent', border:'none', color:'#ef4444', cursor:'pointer'}}><Trash2 size={14}/></button></td>
                          {ML_COLUMNS.map(col => <td key={col.key} style={styles.td}>{renderTableCell('ML', col, row, idx, updateMl)}</td>)}
                        </tr>
                      );
                    })}
                    {mlRows.length === 0 && <tr><td colSpan={ML_COLUMNS.length + 1} style={{textAlign: 'center', padding: '20px', color: '#64748b'}}>No ML records added. Click 'Add ML Row' to begin.</td></tr>}
                    {mlRows.length > 0 && visibleMlRowsCount === 0 && <tr><td colSpan={ML_COLUMNS.length + 1} style={{textAlign: 'center', padding: '20px', color: '#64748b'}}>No records found matching "{mlSearch}".</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}