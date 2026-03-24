import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Save, Plus, Layers, FileAudio, FileText, Trash2, CheckCircle2, FolderOpen, Loader2, Search, MessageSquare, Edit, Database } from "lucide-react";
import { toast } from "sonner";
import mediaInfoFactory from 'mediainfo.js';

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

const determineMasterQuality = (filename: string, isPhoto: boolean): string => {
  if (isPhoto) return "Photos";
  const fn = filename.toUpperCase();
  if (fn.includes("_0") || fn.includes("_1") || fn.includes("_9")) return "Video - High Res";
  if (fn.includes("_A") || fn.includes("_B") || fn.includes("_C") || fn.includes("_D") || fn.includes("_E") || fn.includes("_F") || fn.includes("_G")) return "Video - Low Res";
  if (fn.includes("_M") || fn.includes("_N")) return "Audio - Low Res";
  if (fn.includes("_W") || fn.includes("_X")) return "Audio - High Res";
  if (fn.includes("_H") || fn.includes("_I") || fn.includes("_J") || fn.includes("_K")) return "Project File";
  return "";
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
    // 1. Auto-fetch Event Code from project
    const eventCode = currentEventCode || row.eventCode;
    
    if (!row.dmCode) return { ...row, eventCode, logSrNo: "", mlUniqueId: "", footageSrNo: (idx + 1).toString() }; 

    // 2. Calculate Log Serial (001, 002...) per DM Code
    dmCodeCounts[row.dmCode] = (dmCodeCounts[row.dmCode] || 0) + 1;
    const serialNum = dmCodeCounts[row.dmCode];
    const logSerialFormatted = String(serialNum).padStart(3, '0');
    
    // 3. ML Unique ID = Digital Media Code + "." + Log Serial
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
    options: [" ", "Other Clips","Pujan","Pravachan","Prasangik Udbodhan","SU","SU - GM","SU - Extracted","SU - Revision","SU - Capsule","Satsang","Informal Satsang","Nemiji:Satsang","SRMD - Shibirs/Session/Training/Workshops","Non-SRMD - Shibirs/Session/Training/Workshops","SU:SRMD - Shibirs/Session/Training/Workshops","Pratishtha","Padhramani","Padhramani:Pratishtha","Meditation","Drama/Skit","Prarthana","Bhakti","Celebrations","Celebrations:Bhakti","Celebrations:Drama/Skit","Celebrations:Heartfelt Experience","Heartfelt Experiences","Highlights","Highlights - Informal","Highlights - Mixed","PEP - Post Event Promo","Satsang Clips","Other Clips","Promo","Documentary","Other Edited Videos","Product/Webseries","Event/Feel Good Reel","Bhakti:Drama/Skit"],
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
  { key: "footagePrivacy", label: "Footage (VERY PRIVATE?)", type: "select", options: ["No", "Yes", "Confidential"], disabled: false, styling: { width: "130px" } },
  { key: "bapaNotPresent", label: "If Bapa NOT Present", type: "text", disabled: false, styling: { width: "130px" } },
  { key: "guidanceReceived", label: "Guidance from PPG/Hierarchy", type: "text", disabled: false, styling: { width: "160px" } },
  { key: "eventRefRemarks", label: "Event Reference - Remarks/Counters", type: "text", disabled: false, styling: { width: "160px" } },
  { key: "eventRef1MLId", label: "Event Reference 1 - ML ID", type: "text", disabled: false, styling: { width: "150px" } },
  { key: "eventRef2MLId", label: "Event Reference 2 - ML ID", type: "text", disabled: false, styling: { width: "150px" } },
  { key: "subTitles", label: "Sub-Titles", type: "text", disabled: false, styling: { width: "130px" } },
  { key: "subTitlesLanguage", label: "Sub Titles Language", type: "text", disabled: false, styling: { width: "130px" } },
  { key: "editingTypeAudio", label: "Editing Type (Audio)", type: "text", disabled: false, styling: { width: "130px" } },
  { key: "bhajanTypeTheme", label: "Bhajan Type/Theme", type: "text", disabled: false, styling: { width: "130px" } },
  { key: "grading", label: "Grading", type: "select", options: ["A", "B", "C", "D", "Pending"], disabled: false, styling: { width: "90px" } }
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
    backgroundColor: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff",
    height: "36px", borderRadius: "6px", padding: "0 10px", outline: "none", fontSize: "0.85rem", width: "100%"
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
    const disabled = colDef?.disabled;
    const isSelect = colDef?.type === 'select' || colDef?.type === 'dr-select' || colDef?.type === 'date';

    if (table === 'DR') {
      let newRows = [...drRows];
      for (let i = minRow; i <= maxRow; i++) {
        if (i !== startRow && !disabled) {
          const step = i - startRow;
          newRows[i] = { ...newRows[i], [currentCol]: calculateSmartFillValue(startValue, step, !isSelect) };
        }
      }
      setDrRows(newRows);
    } 
    else if (table === 'ML') {
      let newRows = [...mlRows];
      for (let i = minRow; i <= maxRow; i++) {
        if (i !== startRow && !disabled) {
          const step = i - startRow;
          newRows[i] = { ...newRows[i], [currentCol]: calculateSmartFillValue(startValue, step, !isSelect) };
          
          if (currentCol === 'counterFrom' || currentCol === 'counterTo') {
            const fromSec = parseTimeToSeconds(newRows[i].counterFrom);
            const toSec = parseTimeToSeconds(newRows[i].counterTo);
            newRows[i].duration = (toSec >= fromSec && newRows[i].counterTo && newRows[i].counterFrom) ? formatSecondsToTime(toSec - fromSec) : (newRows[i].counterTo && newRows[i].counterFrom ? "Invalid" : "");
          }
        }
      }
      if (currentCol === 'dmCode') newRows = recalculateMLSerials(newRows, project.autoEventCode);
      setMlRows(newRows);
    }
    setDragState(null);
  };

  const handleDoubleClickFill = (table: 'DR' | 'ML', startRow: number, currentCol: string, startValue: any) => {
    const columns = table === 'DR' ? DR_COLUMNS : ML_COLUMNS;
    const colDef = columns.find(c => c.key === currentCol);
    if (colDef?.disabled) return;
    const isSelect = colDef?.type === 'select' || colDef?.type === 'dr-select' || colDef?.type === 'date';

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
        if (currentCol === 'counterFrom' || currentCol === 'counterTo') {
          const fromSec = parseTimeToSeconds(newRows[i].counterFrom);
          const toSec = parseTimeToSeconds(newRows[i].counterTo);
          newRows[i].duration = (toSec >= fromSec && newRows[i].counterTo && newRows[i].counterFrom) ? formatSecondsToTime(toSec - fromSec) : (newRows[i].counterTo && newRows[i].counterFrom ? "Invalid" : "");
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

      const newDrs: any[] = [];
      let newMls: any[] = [];

      // 1. Generate DR Rows based on Template
      tpl.dr.forEach((drTpl: any) => {
        const newDrCode = generateCode('DR-', 4);
        newDrs.push({ ...emptyDrRow, ...drTpl, dmCode: newDrCode });
      });

      // 2. Logic for "Pravachan at Yogi" - Create 8 specific ML entries
      if (templateName === "Pravachan at Yogi") {
        const contentDetailsList = [
          "Pujya Gurudevshri's Entry",
          "Announcement",
          "Video :",
          "Mangalacharan",
          "Pravachan",
          "End Bhakti",
          "Arti",
          "Pujya Gurudevshri Blessing Mumukshus"
        ];
        
        // Use the DM code generated for the first DR row as the default link
        const dmCode = newDrs[0]?.dmCode || "";

      newMls = contentDetailsList.map((cd) => ({
          ...emptyMlRow,
          contentDetails: cd,
          dmCode: dmCode,
          timeOfDay: "Eve", // Auto-fill as requested
          contentLocation: "Yogi Sabhagruh",
          contentCountry: "India",
          contentState: "Maharashtra",
          contentCity: "Mumbai",
          editingStatus: "Unedited", // Optional: set a default from your new list
          footageType: "AS IT IS"     // Optional: set a default from your new list
        }));
      } else {
        // Default behavior for other templates (creates 1 ML row per DR row)
        newMls = newDrs.map(dr => ({
          ...emptyMlRow,
          dmCode: dr.dmCode,
          contentLocation: tpl.project.location || "",
          contentCountry: tpl.project.country || "",
          contentState: tpl.project.state || "",
          contentCity: tpl.project.city || ""
        }));
      }

      setDrRows(newDrs);
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
    
    const newDrs: any[] = [];
    const newMls: any[] = [];

    // Define the special labels for Pravachan at Yogi
    const pravachanDetails = [
      "Pujya Gurudevshri's Entry",
      "Announcement",
      "Video :",
      "Mangalacharan",
      "Pravachan",
      "End Bhakti",
      "Arti",
      "Pujya Gurudevshri Blessing Mumukshus"
    ];

    // For each generated Digital Media Code
    generatedCodes.forEach((code) => {
      // Create one DR row per code
      newDrs.push({ 
        ...emptyDrRow, 
        dmCode: code 
      });

      // Check if the selected template is Pravachan at Yogi
   if (project.template === "Pravachan at Yogi") {
        pravachanDetails.forEach((detail) => {
          newMls.push({
            ...emptyMlRow,
            dmCode: code,
            contentDetails: detail,
            timeOfDay: "Eve",
            contentCountry: "India",
            contentState: "Maharashtra",
            contentCity: "Mumbai",
            contentLocation: "Yogi Sabhagruh"
          });
        });
      } else {
        // Default behavior: Create 1 ML row for this code
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

    setDrRows(newDrs);
    setMlRows(recalculateMLSerials(newMls, project.autoEventCode));

    toast.success(`Project created with ${project.contCodeCount} digital master(s)!`);
    setViewMode('editor');
    setIsProjectCreated(true);
  };

  // ==========================================
  // SCAN FOLDER LOGIC WITH MODAL YIELD FIX
  // ==========================================
  const extractFolderMetadata = async (files: FileList): Promise<any[]> => {
    const scannedRows: any[] = [];
    const MEDIA_EXTENSIONS = {
      '.avi': true, '.mp4': true, '.mov': true, '.mxf': true, '.mkv': true, 
      '.mpg': true, '.mts': true, '.2ts': true, '.peg': true, '.vob': true, 
      '.m4v': true, '.m2t': true, '.mp3': true, '.wav': true
    };
    
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
      if (file.name.startsWith('.')) continue;
      if (file.name.toLowerCase() === 'desktop.ini') continue;
      
      // @ts-ignore
      const webkitPath = file.webkitRelativePath || '';
      const folderPath = webkitPath ? webkitPath.substring(0, webkitPath.lastIndexOf('/')) : 'Scanned Directory';
      
      if (!folderMap.has(folderPath)) {
        folderMap.set(folderPath, []);
      }
      folderMap.get(folderPath)!.push(file);
    }

    // Process each folder
    let srNo = 1;
    for (const [folderPath, filesInFolder] of folderMap) {
      const folderName = folderPath.split('/').pop() || folderPath;
      const subFolders = folderPath.split('/').filter(f => f);
      
      // Create summary row for folder
      let totalFiles = 0;
      let totalSize = 0;
      let totalDuration = 0;
      const formats = new Set<string>();
      const videoBitrates = new Set<string>();
      const audioBitrates = new Set<string>();
      let hasVideo = false;
      let hasAudio = false;
      let hasPhoto = false;
      let masterQualityDetected = "";

      for (const file of filesInFolder) {
        totalFiles++;
        totalSize += file.size;
        
        const ext = ('.' + file.name.split('.').pop()?.toLowerCase()).toLowerCase();
        
        if (ext in PHOTO_EXTENSIONS) {
          formats.add(ext.toUpperCase().slice(1) || 'PHOTO_NO_EXT');
          hasPhoto = true;
          masterQualityDetected = "Photos";
        } else if (ext === '.zip') {
          formats.add('ZIP');
        } else if (ext in AUDIO_EXTENSIONS) {
          formats.add(ext.toUpperCase().slice(1));
          hasAudio = true;
          // Here you would call HTML5 audio metadata extraction
          // For now, placeholder for bitrate extraction
        } else if (ext in VIDEO_EXTENSIONS) {
          formats.add(ext === '.2ts' ? '.2TS' : ext.toUpperCase().slice(1));
          hasVideo = true;
          // Here you would call HTML5 video metadata extraction
        }

        // Detect master quality from filename
        const fileNameUpper = file.name.toUpperCase();
        if (fileNameUpper.includes('_0') || fileNameUpper.includes('_1') || fileNameUpper.includes('_9')) {
          masterQualityDetected = "Video - High Res";
        } else if (fileNameUpper.includes('_A') || fileNameUpper.includes('_B') || fileNameUpper.includes('_C') ||
                   fileNameUpper.includes('_D') || fileNameUpper.includes('_E') || fileNameUpper.includes('_F') ||
                   fileNameUpper.includes('_G')) {
          masterQualityDetected = "Video - Low Res";
        } else if (fileNameUpper.includes('_M') || fileNameUpper.includes('_N')) {
          masterQualityDetected = "Audio - Low Res";
        } else if (fileNameUpper.includes('_W') || fileNameUpper.includes('_X')) {
          masterQualityDetected = "Audio - High Res";
        } else if (fileNameUpper.includes('_H') || fileNameUpper.includes('_I') || 
                   fileNameUpper.includes('_J') || fileNameUpper.includes('_K')) {
          masterQualityDetected = "Project File";
        }
      }

      const formatSummary = formats.size > 1 ? 'MULTIPLE' : (formats.size === 1 ? Array.from(formats)[0] : 'N/A');
      const videoBitrateSummary = videoBitrates.size > 1 ? 'MULTIPLE' : (videoBitrates.size === 1 ? Array.from(videoBitrates)[0] : null);
      const audioBitrateSummary = audioBitrates.size > 1 ? 'MULTIPLE' : (audioBitrates.size === 1 ? Array.from(audioBitrates)[0] : null);

      // Determine final master quality
      if (!masterQualityDetected) {
        if (hasPhoto) masterQualityDetected = "Photos";
        else if (hasVideo) masterQualityDetected = "Video Content";
        else if (hasAudio) masterQualityDetected = "Audio Content";
      }

      const digitalCodeExtracted = extractDigitalCode(folderName);
      
      const row = {
        ...emptyDrRow,
        srNo: srNo.toString(),
        folderName: subFolders[0] || folderName,
        subFolder1: subFolders[1] || '',
        subFolder2: subFolders[2] || '',
        subFolder3: subFolders[3] || '',
        subFolder4: subFolders[4] || '',
        dmFolderFileName: folderName,
        noOfFiles: totalFiles.toString(),
        formatType: formatSummary,
        videoBitrate: hasVideo ? videoBitrateSummary : '',
        audioBitrate: hasAudio ? audioBitrateSummary : '',
        fileSizeBytes: totalSize.toString(),
        duration: totalDuration > 0 ? formatSecondsToTime(totalDuration) : '',
        fileSizeGb: (totalSize / (1024 ** 3)).toFixed(2),
        visibleFilesize: formatBytes(totalSize),
        filePath: folderPath,
         dmCode: digitalCodeExtracted || folderName,// ← AUTO-POPULATED from folder name
        masterQuality: masterQualityDetected,
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

  setActiveTab('DR');
  setIsScanning(true);
  
  try {
    const scannedRows = await extractFolderMetadata(files);
    
    if (scannedRows.length > 0) {
      setDrRows(prev => {
        const updated = [...prev, ...scannedRows];
        return updated.map((row, idx) => ({ ...row, srNo: (idx + 1).toString() }));
      });

      // Create ML rows with Auto-filled Event Code and DM Code
      const newMlRows = scannedRows.map(dr => ({
        ...emptyMlRow,
        eventCode: project.autoEventCode, // <--- AUTO FILL EVENT CODE
        dmCode: dr.digitalCode || dr.dmFolderFileName, // <--- AUTO FILL DM CODE
        contentLocation: project.location || '',
        contentCountry: project.country || '',
        contentState: project.state || '',
        contentCity: project.city || ''
      }));

      setMlRows(prev => recalculateMLSerials([...prev, ...newMlRows], project.autoEventCode));
      toast.success(`Scanned ${scannedRows.length} folders!`);
    }
  } catch (error) {
    toast.error('Error scanning folder');
  } finally {
    setIsScanning(false);
  }
};

  const addDrRow = () => setDrRows([...drRows, {...emptyDrRow, dmCode: generateCode('DR-', 4)}]);
  const addMlRow = () => {
  const newRow = { 
    ...emptyMlRow, 
    eventCode: project.autoEventCode, // Pre-fill Event Code
    contentLocation: project.location || "", 
    contentCountry: project.country || "", 
    contentState: project.state || "", 
    contentCity: project.city || "" 
  };
  setMlRows(prev => recalculateMLSerials([...prev, newRow], project.autoEventCode));
};
  const removeDrRow = (index: number) => setDrRows(drRows.filter((_, i) => i !== index));
  const removeMlRow = (index: number) => setMlRows(prev => recalculateMLSerials(prev.filter((_, i) => i !== index), project.autoEventCode));

  const updateDr = (index: number, field: string, value: string) => {
    const updated = [...drRows];
    updated[index][field] = value;
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

    // BASE STYLE FOR ALL CELLS
    let inputStyle: any = { 
      ...styles.cellInput, 
      ...col.styling,
      width: "100%",
      backgroundColor: isHighlighted ? "rgba(59, 130, 246, 0.2)" : "transparent",
      outline: isHighlighted ? "1px solid #3b82f6" : "none",
      opacity: col.disabled ? 0.6 : 1,
    };

    // COMPACT DROPDOWN STYLING
   const selectStyle = {
      ...inputStyle,
      height: "28px", 
      fontSize: "0.75rem",
      padding: "0 4px",
      cursor: "pointer",
      color: row[col.key] ? "#fff" : "#94a3b8",
      textAlign: "center",
      
      appearance: "none",
      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 4px center",
      backgroundSize: "10px"
    };

    // ==========================================
    // DURATION FIELD COLOR CODING
    // ==========================================
    if ((col.key === 'subDuration' || col.key === 'totalDuration' || col.key === 'lowResTotalDuration') && row[col.key]) {
      if (row[col.key] === 'Invalid') {
        inputStyle.color = '#ef4444';
        inputStyle.fontWeight = 600;
      } else if (row[col.key] !== '00:00:00' && row[col.key] !== '') {
        inputStyle.color = '#10b981';
        inputStyle.fontWeight = 600;
      }
    }

    let inputElement;

   if (col.type === "dr-select" || col.type === "select") {
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <select 
            value={row[col.key]} 
            disabled={col.disabled} 
            onChange={e => onChange(idx, col.key, e.target.value)} 
            style={selectStyle}
          >
            <option value="" style={{color: "black"}}>-- Select --</option>
            {(col.type === "dr-select" ? drRows.filter(dr=>dr.dmCode).map(dr => ({value: dr.dmCode, label: dr.dmCode})) : col.options.map((opt: string) => ({value: opt, label: opt}))).map((item: any) => (
              <option key={item.value} value={item.value} style={{color: "black"}}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      );
    } else if (col.type === "select") {
      inputElement = (
        <select 
          value={row[col.key]} 
          disabled={col.disabled} 
          onChange={e => onChange(idx, col.key, e.target.value)} 
          style={{...inputStyle, color: row[col.key] ? "#fff" : "#94a3b8"}}
        >
          <option value="" style={{color: "black"}}>-- Select --</option>
          {col.options.map((opt: string) => (
            <option key={opt} value={opt} style={{color: "black"}}>
              {opt}
            </option>
          ))}
        </select>
      );
    } else {
      inputElement = (
        <input 
          type={col.type || "text"}
          value={row[col.key] || ""}
          disabled={col.disabled}
          placeholder={col.placeholder || ""}
          title={row[col.key] || ""}
          onChange={e => onChange(idx, col.key, e.target.value)}
          style={inputStyle}
        />
      );
    }

    const comment = row._comments?.[col.key];

    return (
      <div 
        style={{ position: "relative", width: "100%", height: "100%" }}
        onContextMenu={(e) => handleContextMenu(e, tableType, idx, col.key)}
        onMouseEnter={() => { if (dragState && dragState.table === tableType) setDragState(p => p ? { ...p, currentRow: idx } : null); }}
      >
        {inputElement}
        {comment && (<div title={comment} style={{ position: "absolute", top: 0, right: 0, borderTop: "8px solid #ef4444", borderLeft: "8px solid transparent", pointerEvents: "none" }} />)}
        
        {!col.disabled && (
          <div 
            onMouseDown={(e) => { e.preventDefault(); setDragState({ table: tableType, startRow: idx, currentRow: idx, currentCol: col.key, startValue: row[col.key] }); }}
            onDoubleClick={() => handleDoubleClickFill(tableType, idx, col.key, row[col.key])}
            style={{
              position: "absolute", bottom: -1, right: -1, width: 7, height: 7, 
              backgroundColor: "#3b82f6", cursor: "crosshair", zIndex: 10,
              opacity: (isHighlighted || row[col.key]) ? 1 : 0
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
                    <td style={{...styles.td, padding: "12px 16px", color: "#94a3b8"}}>{proj.metadata.assignee || "—"}</td>
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
        <div style={styles.header}>
          <button onClick={() => setViewMode('list')} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}><ArrowLeft size={18} /></button>
          <h2 style={{ fontSize: "1.5rem", margin: 0, fontWeight: "bold" }}>Create New Project</h2>
        </div>

        <div style={styles.section}>
          <h3 style={{ margin: "0 0 20px 0", color: "#fff" }}>Step 1: Project Details</h3>
          <div style={styles.grid}>
            {renderInput("Name", project.name, v => setProject({...project, name: v}), "text", "span 2")}
            {renderInput("Auto Event Code", project.autoEventCode, () => {}, "text", "auto", true)}
            {renderInput("Assignee", project.assignee, v => setProject({...project, assignee: v}), "text", "auto")}
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
      <div style={styles.wrapper} className="custom-scrollbar animate-in fade-in zoom-in-95 duration-300">
        <div style={styles.header}>
          <button onClick={() => setViewMode('editor')} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}><ArrowLeft size={18} /></button>
          <h2 style={{ fontSize: "1.5rem", margin: 0, fontWeight: "bold" }}>Configure Project</h2>
        </div>

        <div style={styles.section}>
          <h3 style={{ margin: "0 0 20px 0", color: "#fff" }}>Step 2: Select Template & Content Code Type</h3>
          
          <div style={{...styles.grid, marginBottom: "20px"}}>
            <div style={styles.inputWrapper}>
              <span style={styles.label}>Template Type</span>
              <select value={project.template} onChange={(e) => handleTemplateSelect(e.target.value)} style={{...styles.input, cursor: "pointer"}}>
                <option value="">-- Select Template --</option>
                {Object.keys(TEMPLATES).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={styles.inputWrapper}>
              <span style={styles.label}>Content Code Type</span>
              <select value={project.contCodeType} onChange={(e) => setProject({...project, contCodeType: e.target.value})} style={{...styles.input, cursor: "pointer"}}>
                <option value="">-- Select Content Code Type --</option>
                {CONTENT_CODE_TYPES.map(cct => (
                  <option key={cct.value} value={cct.value}>{cct.label}</option>
                ))}
              </select>
            </div>

            <div style={styles.inputWrapper}>
              <span style={styles.label}>Number of Codes to Generate</span>
              <input 
                type="number" 
               
                value={project.contCodeCount} 
                onChange={(e) => setProject({...project, contCodeCount: Math.max(1, parseInt(e.target.value) || 1)})} 
                style={styles.input}
              />
            </div>
          </div>

          {selectedCodeType && (
            <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
              <p style={{ margin: "0 0 8px 0", color: "#3b82f6", fontWeight: 600, fontSize: "0.9rem" }}>📊 Content Code Summary</p>
              <div style={{ color: "#e2e8f0", fontSize: "0.85rem" }}>
                <p style={{ margin: "0 0 6px 0" }}>
                  <span style={{ color: "#3b82f6", fontWeight: 600 }}>Type:</span> {selectedCodeType.label}
                </p>
               
                <p style={{ margin: 0 }}>
                  <span style={{ color: "#3b82f6", fontWeight: 600 }}>Total Generating:</span> {project.contCodeCount} code(s)
                  {project.template && <span> from template <span style={{ color: "#a855f7", fontWeight: 600 }}>{project.template}</span></span>}
                </p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: "10px", marginTop: 20 }}>
            <button onClick={() => setViewMode('editor')} style={{...styles.buttonSecondary}}>Back</button>
            {project.contCodeType && (
              <button onClick={generateContCodes} style={styles.buttonSuccess}>Generate Codes & Create Project</button>
            )}
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
              <select value={project.template} onChange={(e) => handleTemplateSelect(e.target.value)} style={{...styles.input, width: "250px", border: "1px solid #3b82f6", cursor: "pointer"}}>
                <option value="">-- Apply Standard Template (Optional) --</option>
                <option value="Sadguru Udghosh">Sadguru Udghosh</option>
                <option value="Pravachan Series">Pravachan Series</option>
              </select>
            </div>
          )}
        </div>
        <div style={styles.grid}>
          {renderInput("Project Name", project.name, v => setProject({...project, name: v}), "text", "span 2", isProjectCreated)}
          {renderInput("Event Code (Auto)", project.autoEventCode, () => {}, "text", "auto", true)}
          {renderInput("Project Type", project.projectType, v => setProject({...project, projectType: v}), "text", "auto", isProjectCreated)}
          {renderInput("Event Date From", project.dateFrom, val => setProject({...project, dateFrom: val}), "date", "auto", isProjectCreated)}
          {renderInput("Event Date To", project.dateTo, val => setProject({...project, dateTo: val}), "date", "auto", isProjectCreated)}
          {renderInput("Primary Location", project.location, v => setProject({...project, location: v}), "text", "span 2", isProjectCreated)}
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