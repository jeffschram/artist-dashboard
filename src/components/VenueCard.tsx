import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Id } from "../../convex/_generated/dataModel";
import { MapPin, Users } from "lucide-react";

type Status = "Contacted" | "To Contact" | "Ignore" | "Previous Client";
type Category = "Ultimate Dream Goal" | "Accessible" | "Unconventional";

export interface VenueData {
  _id: Id<"venues">;
  name: string;
  url?: string;
  submissionFormUrl?: string;
  locations: { city?: string; state?: string; country?: string; phoneNumber?: string }[];
  contacts: { name?: string; title?: string; email?: string; notes?: string }[];
  status: Status;
  category: Category;
  notes?: string;
  orderNum: number;
}

interface VenueCardProps {
  venue: VenueData;
  isSelected: boolean;
  onClick: () => void;
  groupBy: "category" | "status";
  /** True when this card's original slot in the list is being dragged (show placeholder) */
  isBeingDragged?: boolean;
  /** True when this card is rendered inside DragOverlay */
  isDragOverlay?: boolean;
}

function getStatusColor(status: Status) {
  switch (status) {
    case "Contacted": return "bg-green-100 text-green-800";
    case "To Contact": return "bg-yellow-100 text-yellow-800";
    case "Ignore": return "bg-gray-100 text-gray-600";
    case "Previous Client": return "bg-teal-100 text-teal-800";
  }
}

function getCategoryColor(category: Category) {
  switch (category) {
    case "Ultimate Dream Goal": return "bg-purple-100 text-purple-800";
    case "Accessible": return "bg-blue-100 text-blue-800";
    case "Unconventional": return "bg-orange-100 text-orange-800";
  }
}

function getAccentBorder(groupBy: "category" | "status", venue: VenueData) {
  if (groupBy === "category") {
    switch (venue.category) {
      case "Ultimate Dream Goal": return "border-l-purple-400";
      case "Accessible": return "border-l-blue-400";
      case "Unconventional": return "border-l-orange-400";
    }
  } else {
    switch (venue.status) {
      case "Contacted": return "border-l-green-400";
      case "To Contact": return "border-l-yellow-400";
      case "Ignore": return "border-l-gray-400";
      case "Previous Client": return "border-l-teal-400";
    }
  }
}

function formatFirstLocation(locations: VenueData["locations"]) {
  const filled = locations.filter((l) => l.city || l.state || l.country);
  if (filled.length === 0) return null;
  const first = filled[0];
  const parts = [first.city, first.state, first.country].filter(Boolean);
  const label = parts.join(", ");
  const extra = filled.length > 1 ? ` +${filled.length - 1} more` : "";
  return label + extra;
}

export function VenueCard({
  venue,
  isSelected,
  onClick,
  groupBy,
  isBeingDragged = false,
  isDragOverlay = false,
}: VenueCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: venue._id, disabled: isDragOverlay });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // When this card is being dragged, show a subtle placeholder
  if (isBeingDragged || isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="border-l-[3px] rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/50 p-3 h-[76px]"
      />
    );
  }

  const contactCount = venue.contacts.filter(
    (c) => c.name || c.email,
  ).length;

  const locationLabel = formatFirstLocation(venue.locations);

  // Show the badge for the axis NOT being grouped
  const badge =
    groupBy === "category" ? (
      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${getStatusColor(venue.status)}`}>
        {venue.status}
      </span>
    ) : (
      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${getCategoryColor(venue.category)}`}>
        {venue.category}
      </span>
    );

  const notesPreview = venue.notes
    ? venue.notes.length > 60
      ? venue.notes.slice(0, 60) + "..."
      : venue.notes
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        border-l-[3px] bg-white rounded-lg border border-gray-200 p-3 cursor-pointer
        select-none transition-shadow duration-150
        ${getAccentBorder(groupBy, venue)}
        ${isDragOverlay ? "shadow-xl" : "hover:shadow-md"}
        ${isSelected ? "ring-2 ring-blue-500 border-blue-300" : ""}
      `}
    >
      {/* Name */}
      <h4 className="font-medium text-sm text-gray-900 truncate leading-tight">
        {venue.name}
      </h4>

      {/* Location + badge row */}
      <div className="flex items-center justify-between gap-2 mt-1.5">
        {locationLabel ? (
          <span className="flex items-center gap-1 text-xs text-gray-500 truncate min-w-0">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{locationLabel}</span>
          </span>
        ) : (
          <span />
        )}
        {badge}
      </div>

      {/* Bottom row: contacts + notes preview */}
      <div className="flex items-center gap-2 mt-1.5">
        {contactCount > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
            <Users size={10} />
            {contactCount}
          </span>
        )}
        {notesPreview && (
          <span className="text-[11px] text-gray-400 truncate min-w-0">
            {notesPreview}
          </span>
        )}
      </div>
    </div>
  );
}
