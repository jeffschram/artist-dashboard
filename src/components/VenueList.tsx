import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Plus, GripVertical, ExternalLink, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Venue {
  _id: Id<"venues">;
  name: string;
  url?: string;
  status: "Contacted" | "To Contact" | "Ignore" | "Previous Client";
  category: "Ultimate Dream Goal" | "Accessible" | "Unconventional" | "For Review";
  orderNum: number;
}

interface VenueListProps {
  venues: Venue[];
  selectedVenueId: Id<"venues"> | null;
  onVenueSelect: (venueId: Id<"venues">) => void;
  onCreateNew: () => void;
}

function getCategoryBadgeClass(category: string) {
  switch (category) {
    case "Ultimate Dream Goal": return "bg-purple-100 text-purple-800 hover:bg-purple-100";
    case "Accessible": return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "Unconventional": return "bg-orange-100 text-orange-800 hover:bg-orange-100";
    case "For Review": return "bg-amber-100 text-amber-800 hover:bg-amber-100";
    default: return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
}

export function VenueList({ venues, selectedVenueId, onVenueSelect, onCreateNew }: VenueListProps) {
  const [draggedItem, setDraggedItem] = useState<Id<"venues"> | null>(null);
  const reorderVenue = useMutation(api.venues.reorder);

  const sortedVenues = [...venues].sort((a, b) => a.orderNum - b.orderNum);

  const handleDragStart = (e: React.DragEvent, venueId: Id<"venues">) => {
    setDraggedItem(venueId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetVenueId: Id<"venues">) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetVenueId) {
      setDraggedItem(null);
      return;
    }

    const targetVenue = venues.find(v => v._id === targetVenueId);
    if (targetVenue) {
      await reorderVenue({
        venueId: draggedItem,
        newOrderNum: targetVenue.orderNum,
      });
    }

    setDraggedItem(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Venues</h2>
          <span className="text-sm text-muted-foreground">{venues.length} total</span>
        </div>
        <Button onClick={onCreateNew} className="w-full">
          <Plus className="h-4 w-4" />
          Add New Venue
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedVenues.map((venue) => (
          <div
            key={venue._id}
            draggable
            onDragStart={(e) => handleDragStart(e, venue._id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, venue._id)}
            onClick={() => onVenueSelect(venue._id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 border-b cursor-pointer hover:bg-muted transition-colors",
              selectedVenueId === venue._id && "bg-primary/5 border-primary/20",
              draggedItem === venue._id && "opacity-50",
            )}
          >
            <div className="cursor-grab active:cursor-grabbing shrink-0 text-muted-foreground">
              <GripVertical className="h-3.5 w-3.5" />
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums w-5 text-right">
              {venue.orderNum}
            </span>
            <h3 className="font-medium text-sm truncate min-w-0 flex-1">
              {venue.name}
            </h3>
            <Badge variant="secondary" className={cn("shrink-0 text-[10px] px-1.5 py-0 border-0", getCategoryBadgeClass(venue.category))}>
              {venue.category}
            </Badge>
            {venue.url ? (
              <a
                href={venue.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 p-1 text-muted-foreground hover:text-primary transition-colors"
                title={venue.url}
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(venue.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
                title={`Search Google for "${venue.name}"`}
              >
                <Search className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}

        {venues.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-lg mb-2">No venues yet</p>
            <p className="text-sm">Click "Add New Venue" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
