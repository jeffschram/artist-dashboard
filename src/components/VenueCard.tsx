import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Id } from "../../convex/_generated/dataModel";
import { MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "Contacted" | "To Contact" | "Ignore" | "Previous Client";
type Category = "Ultimate Dream Goal" | "Accessible" | "Unconventional" | "For Review";

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

function getStatusBadgeClass(status: Status) {
  switch (status) {
    case "Contacted": return "bg-green-100 text-green-800 hover:bg-green-100";
    case "To Contact": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "Ignore": return "bg-gray-100 text-gray-600 hover:bg-gray-100";
    case "Previous Client": return "bg-teal-100 text-teal-800 hover:bg-teal-100";
  }
}

function getCategoryBadgeClass(category: Category) {
  switch (category) {
    case "Ultimate Dream Goal": return "bg-purple-100 text-purple-800 hover:bg-purple-100";
    case "Accessible": return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "Unconventional": return "bg-orange-100 text-orange-800 hover:bg-orange-100";
    case "For Review": return "bg-amber-100 text-amber-800 hover:bg-amber-100";
  }
}

function getAccentBorder(groupBy: "category" | "status", venue: VenueData) {
  if (groupBy === "category") {
    switch (venue.category) {
      case "Ultimate Dream Goal": return "border-l-purple-400";
      case "Accessible": return "border-l-blue-400";
      case "Unconventional": return "border-l-orange-400";
      case "For Review": return "border-l-amber-400";
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
        className="border-l-[3px] rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-3 h-[76px]"
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
      <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 border-0 font-medium", getStatusBadgeClass(venue.status))}>
        {venue.status}
      </Badge>
    ) : (
      <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 border-0 font-medium", getCategoryBadgeClass(venue.category))}>
        {venue.category}
      </Badge>
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
      className={cn(
        "border-l-[3px] bg-card rounded-lg border p-3 cursor-pointer select-none transition-shadow duration-150",
        getAccentBorder(groupBy, venue),
        isDragOverlay ? "shadow-xl" : "hover:shadow-md",
        isSelected && "ring-2 ring-primary border-primary/50",
      )}
    >
      {/* Name */}
      <h4 className="font-medium text-sm truncate leading-tight">
        {venue.name}
      </h4>

      {/* Location + badge row */}
      <div className="flex items-center justify-between gap-2 mt-1.5">
        {locationLabel ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground truncate min-w-0">
            <MapPin className="h-3 w-3 shrink-0" />
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
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Users className="h-2.5 w-2.5" />
            {contactCount}
          </span>
        )}
        {notesPreview && (
          <span className="text-[11px] text-muted-foreground truncate min-w-0">
            {notesPreview}
          </span>
        )}
      </div>
    </div>
  );
}
