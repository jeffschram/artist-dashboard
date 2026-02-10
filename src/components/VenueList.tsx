import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Plus, GripVertical } from "lucide-react";

interface Venue {
  _id: Id<"venues">;
  name: string;
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
            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedVenueId === venue._id ? "bg-blue-50 border-blue-200" : ""
            } ${draggedItem === venue._id ? "opacity-50" : ""}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 cursor-grab active:cursor-grabbing">
                <GripVertical size={16} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{venue.name}</h3>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(venue.status)}`}>
                    {venue.status}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(venue.category)}`}>
                    {venue.category}
                  </span>
                </div>
              </div>
            </div>
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
