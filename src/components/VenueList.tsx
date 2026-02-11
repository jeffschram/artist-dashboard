import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Plus, GripVertical, ExternalLink, Search } from "lucide-react";

interface Venue {
  _id: Id<"venues">;
  name: string;
  url?: string;
  status: "Contacted" | "To Contact" | "Ignore" | "Previous Client";
  category: "Ultimate Dream Goal" | "Accessible" | "Unconventional";
  orderNum: number;
}

interface VenueListProps {
  venues: Venue[];
  selectedVenueId: Id<"venues"> | null;
  onVenueSelect: (venueId: Id<"venues">) => void;
  onCreateNew: () => void;
}

export function VenueList({ venues, selectedVenueId, onVenueSelect, onCreateNew }: VenueListProps) {
  const [draggedItem, setDraggedItem] = useState<Id<"venues"> | null>(null);
  const reorderVenue = useMutation(api.venues.reorder);

  const sortedVenues = [...venues].sort((a, b) => a.orderNum - b.orderNum);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Contacted": return "bg-green-100 text-green-800";
      case "To Contact": return "bg-yellow-100 text-yellow-800";
      case "Ignore": return "bg-gray-100 text-gray-800";
      case "Previous Client": return "bg-teal-100 text-teal-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Ultimate Dream Goal": return "bg-purple-100 text-purple-800";
      case "Accessible": return "bg-blue-100 text-blue-800";
      case "Unconventional": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

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
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Venues</h2>
          <span className="text-sm text-gray-500">{venues.length} total</span>
        </div>
        <button
          onClick={onCreateNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Add New Venue
        </button>
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
            className={`flex items-center gap-2 px-3 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedVenueId === venue._id ? "bg-blue-50 border-blue-200" : ""
            } ${draggedItem === venue._id ? "opacity-50" : ""}`}
          >
            <div className="cursor-grab active:cursor-grabbing shrink-0 text-gray-400">
              <GripVertical size={14} />
            </div>
            <span className="shrink-0 text-[10px] text-gray-400 tabular-nums w-5 text-right">
              {venue.orderNum}
            </span>
            <h3 className="font-medium text-sm text-gray-900 truncate min-w-0 flex-1">
              {venue.name}
            </h3>
            <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded ${getCategoryColor(venue.category)}`}>
              {venue.category}
            </span>
            {venue.url ? (
              <a
                href={venue.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title={venue.url}
              >
                <ExternalLink size={12} />
              </a>
            ) : (
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(venue.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title={`Search Google for "${venue.name}"`}
              >
                <Search size={12} />
              </a>
            )}
          </div>
        ))}

        {venues.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-4">🏛️</div>
            <p className="text-lg mb-2">No venues yet</p>
            <p className="text-sm">Click "Add New Venue" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
