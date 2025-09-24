import React, { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { X, Filter, Star } from "lucide-react";

interface SavedFilter {
  id: string;
  name: string;
  filterGroups: any[];
  createdAt: string;
}

interface SavedFilterTabsProps {
  savedFilters: SavedFilter[];
  activeFilterName: string | null;
  onSelectFilter: (name: string | null) => void;
  onDeleteFilter: (name: string) => void;
}

export function SavedFilterTabs({ 
  savedFilters, 
  activeFilterName, 
  onSelectFilter, 
  onDeleteFilter 
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

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
  {/* Star icon: yellow color using style */}
  <Star className="w-4 h-4" style={{ color: "#f59e0b", fill: "#f59e0b" }} />
  
  {/* "Saved Filters" label */}
  <span
  style={{
    fontSize: "0.875rem",      // text-sm
    fontWeight: 500,           // font-medium
    color: "#a1a1aa"           // custom color
  }}
>
  Saved Filters
</span>

</div>

      
      <div className="flex flex-wrap gap-2">
        {/* "All Data" Button uses variants, styling is kept as is */}
       <Button
  variant={!activeFilterName ? "default" : "outline"}
  size="sm"
  onClick={() => onSelectFilter(null)}
  className="h-8 w-25 text-xs px-2" // h-8: height, w-32: width, text-xs: font size
>
  All Data
</Button>


        
        {/* Saved Filter Tabs */}
       {savedFilters.map((filter) => (
  <div
    key={filter.id}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "0.25rem",
      backgroundColor: "rgba(59, 130, 246, 0.1)", // bg-blue-500/10
      border: "1px solid rgba(59, 130, 246, 0.2)", // border-blue-500/20
      borderRadius: "0.375rem", // rounded-md
      padding: "0.25rem",
    }}
  >
   <Button
  variant="ghost"
  size="sm"
  onClick={() => onSelectFilter(filter.name)}
  style={{
    height: "2rem", // same as h-8
    width: "6.25rem", // w-25 = 6.25rem
    fontSize: "0.75rem", // text-xs
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRight: "0",
    backgroundColor:
      activeFilterName === filter.name ? "#2563eb" : "transparent",
    color: activeFilterName === filter.name ? "#ffffff" : "#bfdbfe",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 0.5rem",
  }}
  onMouseOver={(e) => {
    if (activeFilterName !== filter.name) {
      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
        "rgba(59,130,246,0.2)";
    }
  }}
  onMouseOut={(e) => {
    if (activeFilterName !== filter.name) {
      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
        "transparent";
    }
  }}
>
  <Filter
    className="w-3 h-3 mr-1.5"
    style={{
      width: "0.75rem",
      height: "0.75rem",
      marginRight: "0.375rem",
      fill: "currentColor",
    }}
  />
  {filter.name}
  <Badge
    variant="secondary"
    style={{
      marginLeft: "0.375rem",
      fontSize: "0.75rem",
    }}
  >
    {filter.filterGroups.reduce(
      (count, group) => count + group.rules.length,
      0
    )}
  </Badge>
</Button>



         <Button
  size="sm"
  variant="ghost"
  onClick={(e) => {
    e.stopPropagation();
    handleDeleteClick(filter);
  }}
  title="Delete saved filter"
  style={{
    height: "2rem", // h-8
    width: "1.5rem", // w-6
    padding: 0, // p-0
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0, // rounded-l-none
    color: "#f87171", // text-[#f87171]
    backgroundColor: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  }}
  onMouseOver={(e) => {
    (e.currentTarget as HTMLButtonElement).style.color = "#fca5a5";
    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
      "rgba(239,68,68,0.2)";
  }}
  onMouseOut={(e) => {
    (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
      "transparent";
  }}
>
  <X
    style={{
      width: "0.75rem", // w-3
      height: "0.75rem", // h-3
      color: "currentColor",
    }}
  />
</Button>


          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent
  style={{
    backgroundColor: "rgba(30,41,59,0.95)", // bg-[rgba(30,41,59,0.95)]
    backdropFilter: "blur(10px)",          // backdrop-blur-xl
    border: "1px solid rgba(51,65,85,0.5)" // border-[rgba(51,65,85,0.5)]
  }}
>

         <AlertDialogHeader>
  {/* Dialog title style */}
  <AlertDialogTitle style={{ color: "#f1f5f9", fontSize: "1.25rem", fontWeight: 500 }}>
    Delete Saved Filter
  </AlertDialogTitle>
  {/* Dialog description style */}
  <AlertDialogDescription style={{ color: "#cbd5e1", fontSize: "0.875rem" }}>
    Are you sure you want to delete the filter "{filterToDelete?.name}"? This action cannot be undone.
  </AlertDialogDescription>
</AlertDialogHeader>

          <AlertDialogFooter>
            {/* Cancel button styles */}
           <AlertDialogCancel
  style={{
    backgroundColor: "#334155",
    border: "1px solid #475569",
    color: "#e2e8f0",
    padding: "0.5rem 1rem",
    borderRadius: "0.375rem", // optional: same as rounded-md
    transition: "background-color 0.2s",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = "#475569";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = "#334155";
  }}
>
  Cancel
</AlertDialogCancel>

           <AlertDialogAction
  onClick={handleConfirmDelete}
  style={{
    backgroundColor: "#dc2626",
    border: "1px solid #dc2626",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = "#b91c1c";
    e.currentTarget.style.borderColor = "#b91c1c";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = "#dc2626";
    e.currentTarget.style.borderColor = "#dc2626";
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