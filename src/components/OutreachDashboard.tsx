import { useState, useMemo, useCallback, useEffect } from "react";
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
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { SlideOver } from "./SlideOver";
import { OutreachDetail } from "./OutreachDetail";
import {
  Plus,
  Search,
  Building2,
  Users,
  FolderKanban,
  Mail,
  Phone,
  MessageSquare,
  FileText,
  Globe,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  List,
  Columns3,
  Table2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// ── types & constants ──────────────────────────────────────

type OutreachStatus =
  | "Sent"
  | "Awaiting Response"
  | "Responded"
  | "Follow Up Needed"
  | "No Response"
  | "Declined"
  | "Accepted";

type ViewMode = "timeline" | "kanban" | "table";
type Mode = "idle" | "editing" | "creating";

const STATUS_COLUMNS: {
  key: OutreachStatus;
  title: string;
  accent: string;
}[] = [
  { key: "Sent", title: "Sent", accent: "bg-blue-500" },
  {
    key: "Awaiting Response",
    title: "Awaiting Response",
    accent: "bg-yellow-500",
  },
  { key: "Responded", title: "Responded", accent: "bg-green-500" },
  {
    key: "Follow Up Needed",
    title: "Follow Up Needed",
    accent: "bg-orange-500",
  },
  { key: "No Response", title: "No Response", accent: "bg-gray-400" },
  { key: "Declined", title: "Declined", accent: "bg-red-500" },
  { key: "Accepted", title: "Accepted", accent: "bg-emerald-500" },
];

const ALL_COLUMN_KEYS = STATUS_COLUMNS.map((c) => c.key as string);

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "Sent":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "Awaiting Response":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "Responded":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "Follow Up Needed":
      return "bg-orange-100 text-orange-800 hover:bg-orange-100";
    case "No Response":
      return "bg-gray-100 text-gray-600 hover:bg-gray-100";
    case "Declined":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    case "Accepted":
      return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
}

function getMethodIcon(method: string) {
  switch (method) {
    case "Email":
      return <Mail className="h-3.5 w-3.5" />;
    case "Phone":
      return <Phone className="h-3.5 w-3.5" />;
    case "In Person":
      return <MessageSquare className="h-3.5 w-3.5" />;
    case "Submission Form":
      return <FileText className="h-3.5 w-3.5" />;
    case "Social Media":
      return <Globe className="h-3.5 w-3.5" />;
    default:
      return <MoreHorizontal className="h-3.5 w-3.5" />;
  }
}

// ── Kanban card ─────────────────────────────────────────────

interface OutreachCardInnerProps {
  entry: any;
  venueName: string;
  contactName: string;
  onClick: () => void;
  isBeingDragged?: boolean;
}

function OutreachCardInner({
  entry,
  venueName,
  contactName,
  onClick,
  isBeingDragged,
}: OutreachCardInnerProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: entry._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isBeingDragged) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-12 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5"
      />
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <button
        onClick={onClick}
        className="w-full text-left bg-card p-3 rounded-lg border hover:border-primary/30 hover:shadow-sm transition-all group cursor-grab active:cursor-grabbing"
      >
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
              {entry.subject}
            </h3>
            <span className="text-muted-foreground shrink-0">
              {entry.direction === "Outbound" ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownLeft className="h-3.5 w-3.5" />
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {getMethodIcon(entry.method)}
            <span>{entry.date}</span>
          </div>

          {(venueName || contactName) && (
            <div className="space-y-1 pt-1 border-t">
              {venueName && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">{venueName}</span>
                </div>
              )}
              {contactName && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3 shrink-0" />
                  <span className="truncate">{contactName}</span>
                </div>
              )}
            </div>
          )}

          {entry.followUpDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
              <Calendar className="h-3 w-3" />
              <span>Follow up: {entry.followUpDate}</span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

// ── Kanban column ───────────────────────────────────────────

interface OutreachColumnProps {
  id: string;
  title: string;
  accent: string;
  entries: any[];
  activeId: Id<"outreach"> | null;
  venueMap: Map<any, any>;
  contactMap: Map<any, any>;
  onSelect: (id: Id<"outreach">) => void;
}

function OutreachColumn({
  id,
  title,
  accent,
  entries,
  activeId,
  venueMap,
  contactMap,
  onSelect,
}: OutreachColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const entryIds = entries.map((e) => e._id);

  return (
    <div
      className={cn(
        "flex flex-col min-w-0 flex-1 rounded-xl bg-muted/60 transition-colors duration-200",
        isOver && "bg-primary/5 ring-2 ring-primary/20",
      )}
    >
      <div className="px-4 py-3 flex items-center gap-2">
        <div className={cn("w-2.5 h-2.5 rounded-full", accent)} />
        <h3 className="font-semibold text-sm truncate">{title}</h3>
        <Badge variant="secondary" className="ml-auto text-xs rounded-full">
          {entries.length}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 min-h-[100px]"
      >
        <SortableContext
          items={entryIds}
          strategy={verticalListSortingStrategy}
        >
          {entries.map((entry) => (
            <OutreachCardInner
              key={entry._id}
              entry={entry}
              venueName={
                entry.venueId
                  ? (venueMap.get(entry.venueId)?.name ?? "")
                  : ""
              }
              contactName={
                entry.contactId
                  ? (contactMap.get(entry.contactId)?.name ?? "")
                  : ""
              }
              onClick={() => onSelect(entry._id)}
              isBeingDragged={activeId === entry._id}
            />
          ))}
        </SortableContext>

        {entries.length === 0 && !activeId && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">
            Drop outreach here
          </div>
        )}
      </div>
    </div>
  );
}

// ── Timeline view ───────────────────────────────────────────

interface TimelineViewProps {
  entries: any[];
  venueMap: Map<any, any>;
  contactMap: Map<any, any>;
  projectMap: Map<any, any>;
  onSelect: (id: Id<"outreach">) => void;
}

function TimelineView({
  entries,
  venueMap,
  contactMap,
  projectMap,
  onSelect,
}: TimelineViewProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Mail className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-sm">No outreach entries yet</p>
        <p className="text-xs mt-1">
          Log your first outreach to start tracking
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-6 max-w-4xl mx-auto">
      {entries.map((entry) => {
        const venueName = entry.venueId
          ? venueMap.get(entry.venueId)?.name
          : null;
        const contactName = entry.contactId
          ? contactMap.get(entry.contactId)?.name
          : null;
        const projectName = entry.projectId
          ? projectMap.get(entry.projectId)?.name
          : null;

        return (
          <button
            key={entry._id}
            onClick={() => onSelect(entry._id)}
            className="w-full text-left bg-card p-4 rounded-lg border hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-1 pt-0.5 text-muted-foreground">
                {entry.direction === "Outbound" ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownLeft className="h-4 w-4" />
                )}
                {getMethodIcon(entry.method)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    {entry.subject}
                  </h3>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "border-0 shrink-0",
                      getStatusBadgeClass(entry.status),
                    )}
                  >
                    {entry.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                  <span>{entry.date}</span>
                  <span className="text-xs">
                    {entry.method} · {entry.direction}
                  </span>
                </div>
                {(venueName || contactName || projectName) && (
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {venueName && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {venueName}
                      </span>
                    )}
                    {contactName && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {contactName}
                      </span>
                    )}
                    {projectName && (
                      <span className="flex items-center gap-1">
                        <FolderKanban className="h-3 w-3" />
                        {projectName}
                      </span>
                    )}
                  </div>
                )}
                {entry.followUpDate && (
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-orange-600">
                    <Calendar className="h-3 w-3" />
                    Follow up: {entry.followUpDate}
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Table view ──────────────────────────────────────────────

interface TableViewProps {
  entries: any[];
  venueMap: Map<any, any>;
  contactMap: Map<any, any>;
  onSelect: (id: Id<"outreach">) => void;
}

function TableView({ entries, venueMap, contactMap, onSelect }: TableViewProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Mail className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-sm">No outreach entries yet</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-left p-3 font-medium">Subject</th>
              <th className="text-left p-3 font-medium">Method</th>
              <th className="text-left p-3 font-medium">Direction</th>
              <th className="text-left p-3 font-medium">Venue</th>
              <th className="text-left p-3 font-medium">Person</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Follow Up</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry._id}
                onClick={() => onSelect(entry._id)}
                className="border-b last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <td className="p-3 whitespace-nowrap">{entry.date}</td>
                <td className="p-3 font-medium max-w-[200px] truncate">
                  {entry.subject}
                </td>
                <td className="p-3">
                  <span className="flex items-center gap-1.5">
                    {getMethodIcon(entry.method)}
                    {entry.method}
                  </span>
                </td>
                <td className="p-3">
                  <span className="flex items-center gap-1">
                    {entry.direction === "Outbound" ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownLeft className="h-3 w-3" />
                    )}
                    {entry.direction}
                  </span>
                </td>
                <td className="p-3 max-w-[150px] truncate">
                  {entry.venueId
                    ? venueMap.get(entry.venueId)?.name ?? "—"
                    : "—"}
                </td>
                <td className="p-3 max-w-[150px] truncate">
                  {entry.contactId
                    ? contactMap.get(entry.contactId)?.name ?? "—"
                    : "—"}
                </td>
                <td className="p-3">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "border-0 text-xs",
                      getStatusBadgeClass(entry.status),
                    )}
                  >
                    {entry.status}
                  </Badge>
                </td>
                <td className="p-3 whitespace-nowrap text-muted-foreground">
                  {entry.followUpDate || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main dashboard ──────────────────────────────────────────

interface OutreachDashboardProps {
  initialEntityId?: string;
  onNavigationConsumed?: () => void;
}

export function OutreachDashboard({
  initialEntityId,
  onNavigationConsumed,
}: OutreachDashboardProps) {
  const outreach = useQuery(api.outreach.list);
  const venues = useQuery(api.venues.list);
  const contacts = useQuery(api.contacts.list);
  const projects = useQuery(api.projects.list);
  const updateOutreach = useMutation(api.outreach.update);

  const [selectedId, setSelectedId] = useState<Id<"outreach"> | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeId, setActiveId] = useState<Id<"outreach"> | null>(null);
  const [columnOverride, setColumnOverride] = useState<{
    entryId: Id<"outreach">;
    column: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  // ── cross-tab navigation ──────────────────────────────────

  useEffect(() => {
    if (initialEntityId && outreach) {
      const found = outreach.find((o) => o._id === initialEntityId);
      if (found) {
        setSelectedId(found._id);
        setMode("editing");
      }
      onNavigationConsumed?.();
    }
  }, [initialEntityId, outreach, onNavigationConsumed]);

  // ── derived data ──────────────────────────────────────────

  const venueMap = useMemo(() => {
    if (!venues) return new Map();
    return new Map(venues.map((v) => [v._id, v]));
  }, [venues]);

  const contactMap = useMemo(() => {
    if (!contacts) return new Map();
    return new Map(contacts.map((c) => [c._id, c]));
  }, [contacts]);

  const projectMap = useMemo(() => {
    if (!projects) return new Map();
    return new Map(projects.map((p) => [p._id, p]));
  }, [projects]);

  const filteredEntries = useMemo(() => {
    if (!outreach) return [];
    let result = outreach;

    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((o) => {
        const venueName = o.venueId
          ? (venueMap.get(o.venueId)?.name || "").toLowerCase()
          : "";
        const contactName = o.contactId
          ? (contactMap.get(o.contactId)?.name || "").toLowerCase()
          : "";
        return (
          o.subject.toLowerCase().includes(q) ||
          venueName.includes(q) ||
          contactName.includes(q) ||
          o.method.toLowerCase().includes(q) ||
          o.status.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [outreach, statusFilter, searchQuery, venueMap, contactMap]);

  const getEntryColumn = useCallback(
    (entry: any): string => {
      if (columnOverride && columnOverride.entryId === entry._id) {
        return columnOverride.column;
      }
      return entry.status;
    },
    [columnOverride],
  );

  const columns = useMemo(() => {
    return STATUS_COLUMNS.map((col) => ({
      ...col,
      entries: filteredEntries.filter((e) => getEntryColumn(e) === col.key),
    }));
  }, [filteredEntries, getEntryColumn]);

  const resolveOverColumn = useCallback(
    (overId: string | number): string | null => {
      if (ALL_COLUMN_KEYS.includes(overId as string)) {
        return overId as string;
      }
      const overEntry = filteredEntries.find((e) => e._id === overId);
      if (overEntry) {
        return getEntryColumn(overEntry);
      }
      return null;
    },
    [filteredEntries, getEntryColumn],
  );

  // ── loading guard ─────────────────────────────────────────

  if (
    outreach === undefined ||
    venues === undefined ||
    contacts === undefined ||
    projects === undefined
  ) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // ── drag handlers ─────────────────────────────────────────

  const activeEntry = activeId
    ? outreach.find((o) => o._id === activeId) ?? null
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as Id<"outreach">);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setColumnOverride(null);
      return;
    }

    const entryId = active.id as Id<"outreach">;
    const entry = outreach.find((o) => o._id === entryId);
    if (!entry) return;

    const targetColumn = resolveOverColumn(over.id);
    if (!targetColumn) return;

    if (targetColumn !== entry.status) {
      setColumnOverride({ entryId, column: targetColumn });
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

    const entryId = active.id as Id<"outreach">;
    const entry = outreach.find((o) => o._id === entryId);
    if (!entry) {
      setColumnOverride(null);
      return;
    }

    const targetColumnKey = override
      ? override.column
      : resolveOverColumn(over.id);

    if (!targetColumnKey || entry.status === targetColumnKey) {
      setColumnOverride(null);
      return;
    }

    try {
      await updateOutreach({
        id: entryId,
        contactId: entry.contactId,
        venueId: entry.venueId,
        projectId: entry.projectId,
        method: entry.method,
        direction: entry.direction,
        date: entry.date,
        subject: entry.subject,
        notes: entry.notes,
        status: targetColumnKey as OutreachStatus,
        followUpDate: entry.followUpDate,
      });
      toast.success(`Moved to ${targetColumnKey}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setColumnOverride(null);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setColumnOverride(null);
  };

  // ── handlers ──────────────────────────────────────────────

  const handleSelect = (id: Id<"outreach">) => {
    setSelectedId(id);
    setMode("editing");
  };

  const handleCreate = () => {
    setSelectedId(null);
    setMode("creating");
  };

  const handleClose = () => {
    setSelectedId(null);
    setMode("idle");
  };

  // ── render ────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-6 border-b">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Outreach</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredEntries.length}{" "}
            {filteredEntries.length === 1 ? "entry" : "entries"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as ViewMode)}
            className="border rounded-lg"
          >
            <ToggleGroupItem value="timeline" aria-label="Timeline view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="kanban" aria-label="Kanban view">
              <Columns3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view">
              <Table2 className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search outreach..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button onClick={handleCreate} size="sm">
            <Plus className="h-4 w-4" />
            Log Outreach
          </Button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-2 px-6 py-3 border-b overflow-x-auto">
        <button
          onClick={() => setStatusFilter("all")}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-colors",
            statusFilter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          All
        </button>
        {STATUS_COLUMNS.map((col) => (
          <button
            key={col.key}
            onClick={() => setStatusFilter(col.key)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
              statusFilter === col.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {col.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "timeline" && (
          <div className="h-full overflow-y-auto">
            <TimelineView
              entries={filteredEntries}
              venueMap={venueMap}
              contactMap={contactMap}
              projectMap={projectMap}
              onSelect={handleSelect}
            />
          </div>
        )}

        {viewMode === "kanban" && (
          <div className="h-full p-4">
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
                  <OutreachColumn
                    key={col.key}
                    id={col.key}
                    title={col.title}
                    accent={col.accent}
                    entries={col.entries}
                    activeId={activeId}
                    venueMap={venueMap}
                    contactMap={contactMap}
                    onSelect={handleSelect}
                  />
                ))}
              </div>

              <DragOverlay dropAnimation={null}>
                {activeEntry ? (
                  <div className="opacity-90 rotate-[2deg] pointer-events-none w-[280px]">
                    <div className="bg-card p-3 rounded-lg border shadow-lg">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm line-clamp-2">
                          {activeEntry.subject}
                        </h3>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs border-0 shrink-0",
                            getStatusBadgeClass(activeEntry.status),
                          )}
                        >
                          {activeEntry.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}

        {viewMode === "table" && (
          <div className="h-full overflow-y-auto">
            <TableView
              entries={filteredEntries}
              venueMap={venueMap}
              contactMap={contactMap}
              onSelect={handleSelect}
            />
          </div>
        )}
      </div>

      {/* Slide-over */}
      <SlideOver isOpen={mode !== "idle"} onClose={handleClose}>
        <OutreachDetail
          outreachId={selectedId}
          isCreating={mode === "creating"}
          onClose={handleClose}
        />
      </SlideOver>
    </div>
  );
}
