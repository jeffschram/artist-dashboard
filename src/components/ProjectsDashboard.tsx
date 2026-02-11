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

type Mode = "idle" | "editing" | "creating";

function getStatusStyle(status: string) {
  switch (status) {
    case "Planning":
      return "bg-blue-100 text-blue-800";
    case "In Progress":
      return "bg-yellow-100 text-yellow-800";
    case "Completed":
      return "bg-green-100 text-green-800";
    case "Cancelled":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-800";
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              statusFilter === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All ({projects.length})
          </button>
          {["Planning", "In Progress", "Completed", "Cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                statusFilter === s
                  ? "bg-gray-900 text-white"
                  : `${getStatusStyle(s)} hover:opacity-80`
              }`}
            >
              {s} ({statusCounts[s] || 0})
            </button>
          ))}
        </div>

        <button
          onClick={handleCreate}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* Project cards */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
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
                  className="text-left bg-white p-5 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {project.name}
                    </h3>
                    <span
                      className={`shrink-0 px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusStyle(project.status)}`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                    <Building2 size={14} className="shrink-0" />
                    <span className="truncate">{venueDisplay}</span>
                  </div>

                  {project.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-auto pt-2 border-t border-gray-100">
                    {(project.startDate || project.endDate) && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {project.startDate || "?"} — {project.endDate || "?"}
                      </span>
                    )}
                    {project.budget != null && (
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} />
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
