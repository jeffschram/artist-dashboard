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
import { TaskDetail } from "./TaskDetail";
import {
  Plus,
  Search,
  Calendar,
  Building2,
  FolderKanban,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── constants ──────────────────────────────────────────────

type TaskStatus = "To Do" | "In Progress" | "Completed" | "Cancelled";

const STATUS_COLUMNS: { key: TaskStatus; title: string; accent: string }[] = [
  { key: "To Do", title: "To Do", accent: "bg-gray-500" },
  { key: "In Progress", title: "In Progress", accent: "bg-blue-500" },
  { key: "Completed", title: "Completed", accent: "bg-green-500" },
  { key: "Cancelled", title: "Cancelled", accent: "bg-red-500" },
];

const ALL_COLUMN_KEYS = STATUS_COLUMNS.map((c) => c.key as string);

function getPriorityBadgeClass(priority: string) {
  switch (priority) {
    case "Low":
      return "bg-slate-100 text-slate-700 hover:bg-slate-100";
    case "Medium":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "High":
      return "bg-orange-100 text-orange-800 hover:bg-orange-100";
    case "Urgent":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
}

// ── Task card (separate file-level component) ──────────────

interface TaskCardInnerProps {
  task: any;
  venueNames: string;
  projectNames: string;
  contactNames: string;
  onClick: () => void;
  isBeingDragged?: boolean;
  isDragOverlay?: boolean;
}

function TaskCardInner({
  task,
  venueNames,
  projectNames,
  contactNames,
  onClick,
  isBeingDragged,
}: TaskCardInnerProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task._id });

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
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
              {task.title}
            </h3>
            <Badge
              variant="secondary"
              className={cn(
                "text-xs border-0 shrink-0",
                getPriorityBadgeClass(task.priority),
              )}
            >
              {task.priority}
            </Badge>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          {(venueNames || projectNames || contactNames) && (
            <div className="space-y-1 pt-1 border-t">
              {venueNames && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">{venueNames}</span>
                </div>
              )}
              {projectNames && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FolderKanban className="h-3 w-3 shrink-0" />
                  <span className="truncate">{projectNames}</span>
                </div>
              )}
              {contactNames && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3 shrink-0" />
                  <span className="truncate">{contactNames}</span>
                </div>
              )}
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
              <Calendar className="h-3 w-3" />
              <span>Due: {task.dueDate}</span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

// ── Task column (separate file-level component) ────────────

interface TaskColumnBoardProps {
  id: string;
  title: string;
  accent: string;
  tasks: any[];
  activeId: Id<"tasks"> | null;
  venueMap: Map<any, any>;
  projectMap: Map<any, any>;
  contactMap: Map<any, any>;
  taskToVenues: Map<any, any[]>;
  taskToProjects: Map<any, any[]>;
  taskToContacts: Map<any, any[]>;
  onTaskSelect: (id: Id<"tasks">) => void;
}

function TaskColumnBoard({
  id,
  title,
  accent,
  tasks,
  activeId,
  venueMap,
  projectMap,
  contactMap,
  taskToVenues,
  taskToProjects,
  taskToContacts,
  onTaskSelect,
}: TaskColumnBoardProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const taskIds = tasks.map((t) => t._id);

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
          {tasks.length}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 min-h-[100px]"
      >
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => {
            const vIds = taskToVenues.get(task._id) || [];
            const pIds = taskToProjects.get(task._id) || [];
            const cIds = taskToContacts.get(task._id) || [];
            return (
              <TaskCardInner
                key={task._id}
                task={task}
                venueNames={vIds
                  .map((vid: any) => venueMap.get(vid)?.name)
                  .filter(Boolean)
                  .join(", ")}
                projectNames={pIds
                  .map((pid: any) => projectMap.get(pid)?.name)
                  .filter(Boolean)
                  .join(", ")}
                contactNames={cIds
                  .map((cid: any) => contactMap.get(cid)?.name)
                  .filter(Boolean)
                  .join(", ")}
                onClick={() => onTaskSelect(task._id)}
                isBeingDragged={activeId === task._id}
              />
            );
          })}
        </SortableContext>

        {tasks.length === 0 && !activeId && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────

type Mode = "idle" | "editing" | "creating";

export function TasksDashboard() {
  const tasks = useQuery(api.tasks.list);
  const venues = useQuery(api.venues.list);
  const projects = useQuery(api.projects.list);
  const contacts = useQuery(api.contacts.list);
  const taskVenueLinks = useQuery(api.tasks.getAllTaskVenueLinks);
  const taskProjectLinks = useQuery(api.tasks.getAllTaskProjectLinks);
  const taskContactLinks = useQuery(api.tasks.getAllTaskContactLinks);
  const updateTask = useMutation(api.tasks.update);

  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(
    null,
  );
  const [mode, setMode] = useState<Mode>("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState<Id<"tasks"> | null>(null);
  const [columnOverride, setColumnOverride] = useState<{
    taskId: Id<"tasks">;
    column: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  // ── derived data (all hooks before any early return) ─────

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q),
    );
  }, [tasks, searchQuery]);

  const getTaskColumn = useCallback(
    (task: any): string => {
      if (columnOverride && columnOverride.taskId === task._id) {
        return columnOverride.column;
      }
      return task.status;
    },
    [columnOverride],
  );

  const columns = useMemo(() => {
    return STATUS_COLUMNS.map((col) => ({
      ...col,
      tasks: filteredTasks.filter((t) => getTaskColumn(t) === col.key),
    }));
  }, [filteredTasks, getTaskColumn]);

  const resolveOverColumn = useCallback(
    (overId: string | number): string | null => {
      if (ALL_COLUMN_KEYS.includes(overId as string)) {
        return overId as string;
      }
      const overTask = filteredTasks.find((t) => t._id === overId);
      if (overTask) {
        return getTaskColumn(overTask);
      }
      return null;
    },
    [filteredTasks, getTaskColumn],
  );

  const taskToVenues = useMemo(() => {
    if (!taskVenueLinks) return new Map();
    const map = new Map<Id<"tasks">, Id<"venues">[]>();
    for (const link of taskVenueLinks) {
      const existing = map.get(link.taskId) || [];
      map.set(link.taskId, [...existing, link.venueId]);
    }
    return map;
  }, [taskVenueLinks]);

  const taskToProjects = useMemo(() => {
    if (!taskProjectLinks) return new Map();
    const map = new Map<Id<"tasks">, Id<"projects">[]>();
    for (const link of taskProjectLinks) {
      const existing = map.get(link.taskId) || [];
      map.set(link.taskId, [...existing, link.projectId]);
    }
    return map;
  }, [taskProjectLinks]);

  const taskToContacts = useMemo(() => {
    if (!taskContactLinks) return new Map();
    const map = new Map<Id<"tasks">, Id<"contacts">[]>();
    for (const link of taskContactLinks) {
      const existing = map.get(link.taskId) || [];
      map.set(link.taskId, [...existing, link.contactId]);
    }
    return map;
  }, [taskContactLinks]);

  const venueMap = useMemo(() => {
    if (!venues) return new Map();
    return new Map(venues.map((v) => [v._id, v]));
  }, [venues]);

  const projectMap = useMemo(() => {
    if (!projects) return new Map();
    return new Map(projects.map((p) => [p._id, p]));
  }, [projects]);

  const contactMap = useMemo(() => {
    if (!contacts) return new Map();
    return new Map(contacts.map((c) => [c._id, c]));
  }, [contacts]);

  // ── loading guard (after ALL hooks) ──────────────────────

  if (
    tasks === undefined ||
    venues === undefined ||
    projects === undefined ||
    contacts === undefined ||
    taskVenueLinks === undefined ||
    taskProjectLinks === undefined ||
    taskContactLinks === undefined
  ) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // ── drag handlers (plain functions, like VenueBoard) ─────

  const activeTask = activeId
    ? tasks.find((t) => t._id === activeId) ?? null
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as Id<"tasks">);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setColumnOverride(null);
      return;
    }

    const taskId = active.id as Id<"tasks">;
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    const targetColumn = resolveOverColumn(over.id);
    if (!targetColumn) return;

    const currentColumn = task.status;

    if (targetColumn !== currentColumn) {
      setColumnOverride({ taskId, column: targetColumn });
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

    const taskId = active.id as Id<"tasks">;
    const task = tasks.find((t) => t._id === taskId);
    if (!task) {
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

    const columnChanged = task.status !== targetColumnKey;

    if (!columnChanged) {
      setColumnOverride(null);
      return;
    }

    try {
      await updateTask({
        id: taskId,
        title: task.title,
        description: task.description,
        status: targetColumnKey as TaskStatus,
        priority: task.priority,
        dueDate: task.dueDate,
        completedDate: task.completedDate,
        notes: task.notes,
      });
      toast.success(`Task moved to ${targetColumnKey}`);
    } catch {
      toast.error("Failed to move task");
    } finally {
      setColumnOverride(null);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setColumnOverride(null);
  };

  const handleSelect = (id: Id<"tasks">) => {
    setSelectedTaskId(id);
    setMode("editing");
  };

  const handleCreate = () => {
    setSelectedTaskId(null);
    setMode("creating");
  };

  const handleClose = () => {
    setSelectedTaskId(null);
    setMode("idle");
  };

  // ── render ───────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-6 border-b">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredTasks.length}{" "}
            {filteredTasks.length === 1 ? "task" : "tasks"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button onClick={handleCreate} size="sm">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
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
              <TaskColumnBoard
                key={col.key}
                id={col.key}
                title={col.title}
                accent={col.accent}
                tasks={col.tasks}
                activeId={activeId}
                venueMap={venueMap}
                projectMap={projectMap}
                contactMap={contactMap}
                taskToVenues={taskToVenues}
                taskToProjects={taskToProjects}
                taskToContacts={taskToContacts}
                onTaskSelect={handleSelect}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTask ? (
              <div className="opacity-90 rotate-[2deg] pointer-events-none w-[280px]">
                <div className="bg-card p-3 rounded-lg border shadow-lg">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm line-clamp-2">
                      {activeTask.title}
                    </h3>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs border-0 shrink-0",
                        getPriorityBadgeClass(activeTask.priority),
                      )}
                    >
                      {activeTask.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Slide-over */}
      <SlideOver isOpen={mode !== "idle"} onClose={handleClose}>
        <TaskDetail
          taskId={selectedTaskId}
          isCreating={mode === "creating"}
          onClose={handleClose}
        />
      </SlideOver>
    </div>
  );
}
