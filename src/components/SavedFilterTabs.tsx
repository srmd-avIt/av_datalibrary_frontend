import React, { useState } from "react";
import { Badge } from "./ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { X, Filter, Star } from "lucide-react";

interface SavedFilter {
  id: string;
  name: string;
  filterGroups: any[];
  createdAt: string;
  createdBy?: string; // <-- Add this field if not already present
}

interface SavedFilterTabsProps {
  savedFilters: SavedFilter[];
  activeFilterName: string | null;
  onSelectFilter: (name: string | null) => void;
  onDeleteFilter: (name: string) => void;
  currentUser: { email: string; role: string }; // <-- Add this prop
}

export function SavedFilterTabs({ 
  savedFilters, 
  activeFilterName, 
  onSelectFilter, 
  onDeleteFilter,
  currentUser // <-- Add this prop
}: SavedFilterTabsProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [filterToDelete, setFilterToDelete] = useState<SavedFilter | null>(null);

  if (!savedFilters || savedFilters.length === 0) {
    return null;
  }

  const handleDeleteClick = (filter: SavedFilter) => {
    setFilterToDelete(filter);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (filterToDelete) {
      onDeleteFilter(filterToDelete.name);
      setFilterToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const baseButtonStyle = {
    height: '2rem',
    fontSize: '0.75rem',
    lineHeight: '1rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.375rem',
    padding: '0.5rem 1rem',
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out, color 0.2s ease-in-out, border-color 0.2s ease-in-out',
    backgroundColor: 'transparent',
  };

  const defaultVariantStyle = {
    backgroundColor: '#2563eb',
    color: '#ffffff',
  };

  const outlineVariantStyle = {
    borderColor: '#4b5563',
    color: '#d1d5db'
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Star style={{ width: '1rem', height: '1rem', color: '#f59e0b', fill: '#f59e0b' }} />
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#a1a1aa' }}>
          Saved Filters
        </span>
      </div>

      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {/* "All Data" Button */}
        <button
          onClick={() => onSelectFilter(null)}
          style={{
            ...baseButtonStyle,
            ...(!activeFilterName ? defaultVariantStyle : outlineVariantStyle)
          }}
        >
          All Data
        </button>

        
        {/* Saved Filter Tabs */}
        {savedFilters.map((filter) => {
          console.log(
            "createdBy:", filter.createdBy,
            "currentUser.email:", currentUser.email,
            "role:", currentUser.role
          );
          const canDelete =
            (filter.createdBy &&
              currentUser.email &&
              filter.createdBy.trim().toLowerCase() === currentUser.email.trim().toLowerCase()
            ) ||
            currentUser.role?.toLowerCase() === "admin";


          return (
            <div 
              key={filter.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                border: '1px solid rgba(59, 130, 246, 0.2)', 
                borderRadius: '0.375rem' 
              }}
            >
              <button
                onClick={() => onSelectFilter(filter.name)}
                style={{
                  ...baseButtonStyle,
                  padding: '0.5rem',
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  borderRight: 'none',
                  backgroundColor: activeFilterName === filter.name ? '#2563eb' : 'transparent',
                  color: activeFilterName === filter.name ? '#ffffff' : '#bfdbfe',
                }}
                onMouseEnter={(e) => {
                  if (activeFilterName !== filter.name) {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeFilterName !== filter.name) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Filter style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.375rem', fill: 'currentColor' }} />
                {filter.name}
                <Badge
                  variant="secondary"
                  style={{ marginLeft: '0.375rem', fontSize: '0.75rem', backgroundColor: '#4b5569', color: '#e5e7eb' }}
                >
                  {filter.filterGroups.reduce((count, group) => count + group.rules.length, 0)}
                </Badge>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(filter);
                }}
                style={{
                  ...baseButtonStyle,
                  width: '1.5rem',
                  padding: 0,
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  color: '#f87171',
                  opacity: canDelete ? 1 : 0.4,
                  cursor: canDelete ? 'pointer' : 'not-allowed'
                }}
                disabled={!canDelete}
                title={
                  canDelete
                    ? "Delete saved filter"
                    : "Only the creator or an admin can delete this filter"
                }
              >
                <X style={{ width: '0.75rem', height: '0.75rem' }} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent style={{ backgroundColor: 'rgba(30,41,59,0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(51,65,85,0.5)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: '#f1f5f9', fontSize: '1.25rem', fontWeight: 500 }}>
              Delete Saved Filter
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
              Are you sure you want to delete the filter "{filterToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
           <AlertDialogCancel
  style={{
    backgroundColor: '#334155',
    border: '1px solid #475569',
    color: '#e2e8f0',
    padding: '0.5rem 1rem',   // ✅ internal spacing
    borderRadius: '0.375rem', // optional, rounded corners
  }}
  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#475569'; }}
  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#334155'; }}
>
  Cancel
</AlertDialogCancel>

<AlertDialogAction
  onClick={handleConfirmDelete}
  style={{
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: '1px solid #dc2626',
    padding: '0.5rem 1rem',   // ✅ internal spacing
    borderRadius: '0.375rem', // optional
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = '#b91c1c';
    e.currentTarget.style.borderColor = '#b91c1c';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = '#dc2626';
    e.currentTarget.style.borderColor = '#dc2626';
  }}
>
  Delete Filter
</AlertDialogAction>

          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}