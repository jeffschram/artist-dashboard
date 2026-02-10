import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { X, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MarkdownEditor } from "./MarkdownEditor";

interface ProjectDetailProps {
  projectId: Id<"projects"> | null;
  isCreating: boolean;
  /** Pre-fill venue when creating from a venue view */
  defaultVenueId?: Id<"venues">;
  onClose: () => void;
}

type ProjectStatus = "Planning" | "In Progress" | "Completed" | "Cancelled";

export function ProjectDetail({
  projectId,
  isCreating,
  defaultVenueId,
  onClose,
}: ProjectDetailProps) {
  const project = useQuery(
    api.projects.get,
    projectId ? { id: projectId } : "skip",
  );
  const venues = useQuery(api.venues.list);
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const deleteProject = useMutation(api.projects.remove);

  const [formData, setFormData] = useState({
    name: "",
    venueId: "" as string,
    startDate: "",
    endDate: "",
    description: "",
    status: "Planning" as ProjectStatus,
    notes: "",
    budget: "",
    profit: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (project && !isCreating) {
      setFormData({
        name: project.name,
        venueId: project.venueId,
        startDate: project.startDate || "",
        endDate: project.endDate || "",
        description: project.description || "",
        status: project.status,
        notes: project.notes || "",
        budget: project.budget != null ? String(project.budget) : "",
        profit: project.profit != null ? String(project.profit) : "",
      });
    } else if (isCreating) {
      setFormData({
        name: "",
        venueId: defaultVenueId || "",
        startDate: "",
        endDate: "",
        description: "",
        status: "Planning",
        notes: "",
        budget: "",
        profit: "",
      });
    }
  }, [project, isCreating, defaultVenueId]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }
    if (!formData.venueId) {
      toast.error("Please select a venue");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        venueId: formData.venueId as Id<"venues">,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        description: formData.description || undefined,
        status: formData.status,
        notes: formData.notes || undefined,
        budget: formData.budget ? Number(formData.budget) : undefined,
        profit: formData.profit ? Number(formData.profit) : undefined,
      };

      if (isCreating) {
        await createProject(payload);
        toast.success("Project created");
      } else if (projectId) {
        await updateProject({ id: projectId, ...payload });
        toast.success("Project updated");
      }
      onClose();
    } catch {
      toast.error("Failed to save project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId || isCreating) return;
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject({ id: projectId });
        toast.success("Project deleted");
        onClose();
      } catch {
        toast.error("Failed to delete project");
      }
    }
  };

  // Only show "Previous Client" venues in the dropdown
  const previousClientVenues = (venues ?? []).filter(
    (v) => v.status === "Previous Client",
  );

  if (project === undefined && !isCreating) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {isCreating ? "New Project" : "Edit Project"}
          </h2>
          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete project"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Details</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((p) => ({ ...p, name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter project name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venue *
            </label>
            <select
              value={formData.venueId}
              onChange={(e) =>
                setFormData((p) => ({ ...p, venueId: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a venue...</option>
              {previousClientVenues.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.name}
                </option>
              ))}
            </select>
            {previousClientVenues.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No venues with "Previous Client" status. Mark a venue as
                "Previous Client" first.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    status: e.target.value as ProjectStatus,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Short description"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, startDate: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, endDate: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget ($)
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, budget: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profit ($)
              </label>
              <input
                type="number"
                value={formData.profit}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, profit: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
          <MarkdownEditor
            content={formData.notes}
            onChange={(markdown) =>
              setFormData((p) => ({ ...p, notes: markdown }))
            }
            placeholder="Add project notes..."
          />
        </div>
      </div>
    </div>
  );
}
