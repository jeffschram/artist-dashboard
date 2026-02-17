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
import { VenueMap } from "./VenueMap";
import { VenueListPrint } from "./VenueListPrint";
import { VenueTable } from "./VenueTable";
import { Search, Plus, LayoutGrid, Map, List, Columns3, Table as TableIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { VenueScoutDialog } from "./VenueScoutDialog";

type GroupBy = "category" | "status";
type ViewMode = "kanban" | "map" | "list" | "table";

const CATEGORY_COLUMNS: {
  key: "Ultimate Dream Goal" | "Accessible" | "Unconventional" | "For Review";
  title: string;
  accent: string;
}[] = [
  { key: "For Review", title: "For Review", accent: "bg-amber-500" },
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
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [groupBy, setGroupBy] = useState<GroupBy>("category");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState<Id<"venues"> | null>(null);
  const [scoutDialogOpen, setScoutDialogOpen] = useState(false);
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

  const filteredVenues = useMemo(() => {
    if (!searchQuery.trim()) return venues;
    const q = searchQuery.toLowerCase();
    return venues.filter((v) => v.name.toLowerCase().includes(q));
  }, [venues, searchQuery]);

  const getVenueColumn = useCallback(
    (venue: VenueData): string => {
      if (columnOverride && columnOverride.venueId === venue._id) {
        return columnOverride.column;
      }
      return groupBy === "category" ? venue.category : venue.status;
    },
    [groupBy, columnOverride],
  );

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

  const resolveOverColumn = useCallback(
    (overId: string | number): string | null => {
      if (allColumnKeys.includes(overId as string)) {
        return overId as string;
      }
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
      setColumnOverride(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const override = columnOverride;
    setActiveId(null);

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

    const targetColumnKey = override
      ? override.column
      : resolveOverColumn(over.id);

    if (!targetColumnKey) {
      setColumnOverride(null);
      return;
    }

    const currentValue = groupBy === "category" ? venue.category : venue.status;
    const columnChanged = currentValue !== targetColumnKey;

    let targetOrderNum: number | null = null;
    if (!allColumnKeys.includes(over.id as string)) {
      const targetVenue = venues.find((v) => v._id === over.id);
      if (targetVenue && targetVenue._id !== venue._id) {
        targetOrderNum = targetVenue.orderNum;
      }
    }

    if (!columnChanged && targetOrderNum === null) {
      setColumnOverride(null);
      return;
    }

    try {
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
      <div className="px-5 py-3 bg-background border-b flex items-center gap-4 print:hidden">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search venues..."
            className="pl-9"
          />
        </div>

        {/* View mode toggle */}
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(v) => v && setViewMode(v as ViewMode)}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="kanban" aria-label="Kanban board" className="gap-1.5 text-xs">
            <Columns3 className="h-3.5 w-3.5" />
            Board
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table view" className="gap-1.5 text-xs">
            <TableIcon className="h-3.5 w-3.5" />
            Table
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="Printable list" className="gap-1.5 text-xs">
            <List className="h-3.5 w-3.5" />
            List
          </ToggleGroupItem>
          <ToggleGroupItem value="map" aria-label="Map view" className="gap-1.5 text-xs">
            <Map className="h-3.5 w-3.5" />
            Map
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Group by toggle — only relevant in kanban mode */}
        {viewMode === "kanban" && (
          <ToggleGroup
            type="single"
            value={groupBy}
            onValueChange={(v) => v && setGroupBy(v as GroupBy)}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="category" className="gap-1.5 text-xs">
              <LayoutGrid className="h-3.5 w-3.5" />
              Category
            </ToggleGroupItem>
            <ToggleGroupItem value="status" className="gap-1.5 text-xs">
              <LayoutGrid className="h-3.5 w-3.5" />
              Status
            </ToggleGroupItem>
          </ToggleGroup>
        )}

        {/* Venue count */}
        <span className="text-xs text-muted-foreground">
          {filteredVenues.length} venue{filteredVenues.length !== 1 ? "s" : ""}
        </span>

        {/* Action buttons */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={() => setScoutDialogOpen(true)}
            size="sm"
            variant="outline"
          >
            <Sparkles className="h-4 w-4" />
            Scout Venues
          </Button>
          <Button onClick={onCreateNew} size="sm">
            <Plus className="h-4 w-4" />
            Add Venue
          </Button>
        </div>
      </div>

      {/* Content — switch on viewMode */}
      {viewMode === "kanban" && (
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
      )}

      {viewMode === "map" && (
        <div className="flex-1 overflow-hidden">
          <VenueMap venues={filteredVenues} onVenueSelect={onVenueSelect} />
        </div>
      )}

      {viewMode === "list" && (
        <div className="flex-1 overflow-hidden">
          <VenueListPrint venues={filteredVenues} onVenueSelect={onVenueSelect} />
        </div>
      )}

      {viewMode === "table" && (
        <div className="flex-1 overflow-hidden">
          <VenueTable venues={filteredVenues} onVenueSelect={onVenueSelect} />
        </div>
      )}

      <VenueScoutDialog
        open={scoutDialogOpen}
        onOpenChange={setScoutDialogOpen}
      />
    </div>
  );
}
