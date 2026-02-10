import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { BoardColumn } from "./BoardColumn";
import { VenueCard, VenueData } from "./VenueCard";
import { Search, Plus, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

type GroupBy = "category" | "status";

const CATEGORY_COLUMNS: {
  key: "Ultimate Dream Goal" | "Accessible" | "Unconventional";
  title: string;
  accent: string;
}[] = [
  { key: "Ultimate Dream Goal", title: "Ultimate Dream Goal", accent: "bg-purple-500" },
  { key: "Accessible", title: "Accessible", accent: "bg-blue-500" },
  { key: "Unconventional", title: "Unconventional", accent: "bg-orange-500" },
];

const STATUS_COLUMNS: {
  key: "To Contact" | "Contacted" | "Ignore" | "Previous Client";
  title: string;
  accent: string;
}[] = [
  { key: "To Contact", title: "To Contact", accent: "bg-yellow-500" },
  { key: "Contacted", title: "Contacted", accent: "bg-green-500" },
  { key: "Previous Client", title: "Previous Client", accent: "bg-teal-500" },
  { key: "Ignore", title: "Ignore", accent: "bg-gray-400" },
];

interface VenueBoardProps {
  venues: VenueData[];
  selectedVenueId: Id<"venues"> | null;
  onVenueSelect: (venueId: Id<"venues">) => void;
  onCreateNew: () => void;
}

export function VenueBoard({
  venues,
  selectedVenueId,
  onVenueSelect,
  onCreateNew,
}: VenueBoardProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>("category");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState<Id<"venues"> | null>(null);
  // Optimistic column override: when dragging across columns, temporarily
  // reassign the venue to the target column so cards shift to make room.
  const [columnOverride, setColumnOverride] = useState<{
    venueId: Id<"venues">;
    column: string;
  } | null>(null);

  const updateVenue = useMutation(api.venues.update);
  const reorderVenue = useMutation(api.venues.reorder);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const allColumnKeys = useMemo(() => {
    return (groupBy === "category" ? CATEGORY_COLUMNS : STATUS_COLUMNS).map(
      (c) => c.key as string,
    );
  }, [groupBy]);

  // Filter venues by search
  const filteredVenues = useMemo(() => {
    if (!searchQuery.trim()) return venues;
    const q = searchQuery.toLowerCase();
    return venues.filter((v) => v.name.toLowerCase().includes(q));
  }, [venues, searchQuery]);

  // Resolve which column a venue belongs to, accounting for optimistic override
  const getVenueColumn = useCallback(
    (venue: VenueData): string => {
      if (columnOverride && columnOverride.venueId === venue._id) {
        return columnOverride.column;
      }
      return groupBy === "category" ? venue.category : venue.status;
    },
    [groupBy, columnOverride],
  );

  // Group venues into columns
  const columns = useMemo(() => {
    const cols = groupBy === "category" ? CATEGORY_COLUMNS : STATUS_COLUMNS;
    return cols.map((col) => ({
      ...col,
      venues: filteredVenues
        .filter((v) => getVenueColumn(v) === col.key)
        .sort((a, b) => a.orderNum - b.orderNum),
    }));
  }, [filteredVenues, groupBy, getVenueColumn]);

  const activeVenue = activeId
    ? venues.find((v) => v._id === activeId) ?? null
    : null;

  // Determine which column an over target belongs to
  const resolveOverColumn = useCallback(
    (overId: string | number): string | null => {
      // Is it a column directly?
      if (allColumnKeys.includes(overId as string)) {
        return overId as string;
      }
      // It's a card — find which column that card is in
      const overVenue = filteredVenues.find((v) => v._id === overId);
      if (overVenue) {
        return getVenueColumn(overVenue);
      }
      return null;
    },
    [allColumnKeys, filteredVenues, getVenueColumn],
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as Id<"venues">);
  };

  // Called continuously as the dragged item moves over targets
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setColumnOverride(null);
      return;
    }

    const venueId = active.id as Id<"venues">;
    const venue = venues.find((v) => v._id === venueId);
    if (!venue) return;

    const targetColumn = resolveOverColumn(over.id);
    if (!targetColumn) return;

    const currentColumn = groupBy === "category" ? venue.category : venue.status;

    if (targetColumn !== currentColumn) {
      setColumnOverride({ venueId, column: targetColumn });
    } else {
      // Back to original column
      setColumnOverride(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const override = columnOverride;
    setActiveId(null);
    // Keep columnOverride alive — don't clear it yet.
    // It will be cleared after the mutations resolve.

    const { active, over } = event;
    if (!over) {
      setColumnOverride(null);
      return;
    }

    const venueId = active.id as Id<"venues">;
    const venue = venues.find((v) => v._id === venueId);
    if (!venue) {
      setColumnOverride(null);
      return;
    }

    // Use the override if we had one, otherwise resolve from over target
    const targetColumnKey = override
      ? override.column
      : resolveOverColumn(over.id);

    if (!targetColumnKey) {
      setColumnOverride(null);
      return;
    }

    const currentValue = groupBy === "category" ? venue.category : venue.status;
    const columnChanged = currentValue !== targetColumnKey;

    // Determine target position: if dropped on a card, use that card's orderNum
    let targetOrderNum: number | null = null;
    if (!allColumnKeys.includes(over.id as string)) {
      const targetVenue = venues.find((v) => v._id === over.id);
      if (targetVenue && targetVenue._id !== venue._id) {
        targetOrderNum = targetVenue.orderNum;
      }
    }

    // Nothing to do if same column and no position change
    if (!columnChanged && targetOrderNum === null) {
      setColumnOverride(null);
      return;
    }

    try {
      // 1. Update category/status if column changed
      if (columnChanged) {
        await updateVenue({
          id: venue._id,
          name: venue.name,
          url: venue.url,
          submissionFormUrl: venue.submissionFormUrl,
          locations: venue.locations,
          contacts: venue.contacts,
          status: groupBy === "status" ? (targetColumnKey as VenueData["status"]) : venue.status,
          category: groupBy === "category" ? (targetColumnKey as VenueData["category"]) : venue.category,
          notes: venue.notes,
        });
      }

      // 2. Reorder to the drop position
      if (targetOrderNum !== null && targetOrderNum !== venue.orderNum) {
        await reorderVenue({ venueId: venue._id, newOrderNum: targetOrderNum });
      }

      if (columnChanged) {
        toast.success(`Moved "${venue.name}" to ${targetColumnKey}`);
      }
    } catch {
      toast.error("Failed to move venue");
    } finally {
      setColumnOverride(null);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setColumnOverride(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="px-5 py-3 bg-white border-b border-gray-200 flex items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search venues..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Group by toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setGroupBy("category")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              groupBy === "category"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <LayoutGrid size={13} />
            Category
          </button>
          <button
            onClick={() => setGroupBy("status")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              groupBy === "status"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <LayoutGrid size={13} />
            Status
          </button>
        </div>

        {/* Venue count */}
        <span className="text-xs text-gray-500">
          {filteredVenues.length} venue{filteredVenues.length !== 1 ? "s" : ""}
        </span>

        {/* Add button */}
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors ml-auto"
        >
          <Plus size={16} />
          Add Venue
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-4 h-full">
            {columns.map((col) => (
              <BoardColumn
                key={col.key}
                id={col.key}
                title={col.title}
                accentColor={col.accent}
                venues={col.venues}
                selectedVenueId={selectedVenueId}
                onVenueSelect={onVenueSelect}
                groupBy={groupBy}
                activeId={activeId}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeVenue ? (
              <div className="opacity-90 rotate-[2deg] pointer-events-none w-[280px]">
                <VenueCard
                  venue={activeVenue}
                  isSelected={false}
                  onClick={() => {}}
                  groupBy={groupBy}
                  isDragOverlay
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
