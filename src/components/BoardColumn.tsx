import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { VenueCard, VenueData } from "./VenueCard";
import { Id } from "../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
      className={cn(
        "flex flex-col min-w-0 flex-1 rounded-xl bg-muted/60 transition-colors duration-200",
        isOver && "bg-primary/5 ring-2 ring-primary/20",
      )}
    >
      {/* Column header */}
      <div className="px-4 py-3 flex items-center gap-2">
        <div className={cn("w-2.5 h-2.5 rounded-full", accentColor)} />
        <h3 className="font-semibold text-sm truncate">
          {title}
        </h3>
        <Badge variant="secondary" className="ml-auto text-xs rounded-full">
          {venues.length}
        </Badge>
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
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">
            Drop venues here
          </div>
        )}
      </div>
    </div>
  );
}
