import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { VenueCard, VenueData } from "./VenueCard";
import { Id } from "../../convex/_generated/dataModel";

interface BoardColumnProps {
  id: string;
  title: string;
  accentColor: string;
  venues: VenueData[];
  selectedVenueId: Id<"venues"> | null;
  onVenueSelect: (venueId: Id<"venues">) => void;
  groupBy: "category" | "status";
  activeId: Id<"venues"> | null;
}

export function BoardColumn({
  id,
  title,
  accentColor,
  venues,
  selectedVenueId,
  onVenueSelect,
  groupBy,
  activeId,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const venueIds = venues.map((v) => v._id);

  return (
    <div
      className={`flex flex-col min-w-0 flex-1 rounded-xl bg-gray-100/80 transition-colors duration-200 ${
        isOver ? "bg-blue-50/80 ring-2 ring-blue-200" : ""
      }`}
    >
      {/* Column header */}
      <div className="px-4 py-3 flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${accentColor}`} />
        <h3 className="font-semibold text-sm text-gray-800 truncate">
          {title}
        </h3>
        <span className="ml-auto text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded-full shadow-sm">
          {venues.length}
        </span>
      </div>

      {/* Scrollable card list */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 min-h-[100px]"
      >
        <SortableContext items={venueIds} strategy={verticalListSortingStrategy}>
          {venues.map((venue) => (
            <VenueCard
              key={venue._id}
              venue={venue}
              isSelected={selectedVenueId === venue._id}
              onClick={() => onVenueSelect(venue._id)}
              groupBy={groupBy}
              isBeingDragged={activeId === venue._id}
            />
          ))}
        </SortableContext>

        {venues.length === 0 && !activeId && (
          <div className="flex items-center justify-center h-20 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
            Drop venues here
          </div>
        )}
      </div>
    </div>
  );
}
