import React from 'react';

export interface ListItem {
  id: string | number;
  [key: string]: any;
}

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  render?: (value: any, item: ListItem) => React.ReactNode;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "number" | "checkbox";
  options?: { value: string; label: string; }[];
}

export interface ViewConfig {
  id: string;
  name: string;
  filters?: Record<string, any>;
  groupBy?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface FilterGroup {
  id: string;
  rules: FilterRule[];
  logic: "AND" | "OR";
}

export interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: any;
  logic?: "AND" | "OR";
}

export interface SavedFilter {
  id: string;
  name: string;
  filterGroups: FilterGroup[];
  createdAt: string;
}