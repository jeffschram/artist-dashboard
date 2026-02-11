import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { SlideOver } from "./SlideOver";
import { ProjectDetail } from "./ProjectDetail";
import {
  Plus,
  Search,
  Calendar,
  DollarSign,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Mode = "idle" | "editing" | "creating";

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "Planning": return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "In Progress": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "Completed": return "bg-green-100 text-green-800 hover:bg-green-100";
    case "Cancelled": return "bg-gray-100 text-gray-600 hover:bg-gray-100";
    default: return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
}

function formatCurrency(value: number | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProjectsDashboard() {
  const projects = useQuery(api.projects.list);
  const venues = useQuery(api.venues.list);
  const [selectedProjectId, setSelectedProjectId] =
    useState<Id<"projects"> | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  if (projects === undefined || venues === undefined) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const venueMap = new Map(venues.map((v) => [v._id, v.name]));

  const filtered = projects.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const venueNames = (p.venueIds || []).map((id) => venueMap.get(id) || "").join(" ");
      return (
        p.name.toLowerCase().includes(q) ||
        venueNames.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSelect = (id: Id<"projects">) => {
    setSelectedProjectId(id);
    setMode("editing");
  };

  const handleCreate = () => {
    setSelectedProjectId(null);
    setMode("creating");
  };

  const handleClose = () => {
    setSelectedProjectId(null);
    setMode("idle");
  };

  const statusCounts = projects.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="h-[calc(100vh-7rem)]">
      {/* Toolbar */}
      <div className="px-6 py-4 bg-background border-b flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "secondary"}
            size="sm"
            className="rounded-full text-xs"
            onClick={() => setStatusFilter("all")}
          >
            All ({projects.length})
          </Button>
          {["Planning", "In Progress", "Completed", "Cancelled"].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-full text-xs",
                statusFilter !== s && "border-0",
                statusFilter !== s && getStatusBadgeClass(s),
              )}
              onClick={() => setStatusFilter(s)}
            >
              {s} ({statusCounts[s] || 0})
            </Button>
          ))}
        </div>

        <Button onClick={handleCreate} size="sm" className="ml-auto">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Project cards */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">No projects found</p>
            <p className="text-sm mt-1">
              {projects.length === 0
                ? 'Create your first project by clicking "New Project"'
                : "Try adjusting your search or filter"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => {
              const venueNames = (project.venueIds || [])
                .map((id) => venueMap.get(id))
                .filter(Boolean);
              const venueDisplay =
                venueNames.length > 0
                  ? venueNames.join(", ")
                  : "No venues assigned";
              return (
                <button
                  key={project._id}
                  onClick={() => handleSelect(project._id)}
                  className="text-left bg-card p-5 rounded-xl border hover:border-primary/30 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                      {project.name}
                    </h3>
                    <Badge variant="secondary" className={cn("shrink-0 border-0", getStatusBadgeClass(project.status))}>
                      {project.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{venueDisplay}</span>
                  </div>

                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto pt-2 border-t">
                    {(project.startDate || project.endDate) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {project.startDate || "?"} — {project.endDate || "?"}
                      </span>
                    )}
                    {project.budget != null && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(project.budget)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-over */}
      <SlideOver isOpen={mode !== "idle"} onClose={handleClose}>
        <ProjectDetail
          projectId={selectedProjectId}
          isCreating={mode === "creating"}
          onClose={handleClose}
        />
      </SlideOver>
    </div>
  );
}
