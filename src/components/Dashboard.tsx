import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { VenueBoard } from "./VenueBoard";
import { VenueView } from "./VenueView";
import { VenueDetail } from "./VenueDetail";
import { ProjectDetail } from "./ProjectDetail";
import { TaskDetail } from "./TaskDetail";
import { SlideOver } from "./SlideOver";
import { Id } from "../../convex/_generated/dataModel";

type Mode =
  | "idle"
  | "viewing"
  | "editing"
  | "creating"
  | "creating-project"
  | "editing-project"
  | "creating-task";

export function Dashboard() {
  const venues = useQuery(api.venues.list);
  const [selectedVenueId, setSelectedVenueId] = useState<Id<"venues"> | null>(
    null,
  );
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);
  const [mode, setMode] = useState<Mode>("idle");

  if (venues === undefined) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleCreateNew = () => {
    setSelectedVenueId(null);
    setMode("creating");
  };

  const handleVenueSelect = (venueId: Id<"venues">) => {
    setSelectedVenueId(venueId);
    setMode("viewing");
  };

  const handleEdit = () => {
    setMode("editing");
  };

  const handleCloseSlideOver = () => {
    setSelectedVenueId(null);
    setSelectedProjectId(null);
    setMode("idle");
  };

  const handleCloseDetail = () => {
    if (mode === "editing" && selectedVenueId) {
      setMode("viewing");
    } else {
      setSelectedVenueId(null);
      setMode("idle");
    }
  };

  const handleAddProject = (venueId: Id<"venues">) => {
    setSelectedProjectId(null);
    // Keep selectedVenueId so we can return to it
    setMode("creating-project");
  };

  const handleEditProject = (projectId: Id<"projects">) => {
    setSelectedProjectId(projectId);
    setMode("editing-project");
  };

  const handleCloseProjectDetail = () => {
    setSelectedProjectId(null);
    // Return to venue view
    if (selectedVenueId) {
      setMode("viewing");
    } else {
      setMode("idle");
    }
  };

  const handleCreateTask = (_venueId: Id<"venues">) => {
    setMode("creating-task");
  };

  const handleCloseTaskDetail = () => {
    // Return to venue view
    if (selectedVenueId) {
      setMode("viewing");
    } else {
      setMode("idle");
    }
  };

  const isSlideOverOpen = mode !== "idle";

  return (
    <div className="h-[calc(100vh-7rem)]">
      {/* Full-width board */}
      <VenueBoard
        venues={venues}
        selectedVenueId={selectedVenueId}
        onVenueSelect={handleVenueSelect}
        onCreateNew={handleCreateNew}
      />

      {/* Slide-over drawer */}
      <SlideOver isOpen={isSlideOverOpen} onClose={handleCloseSlideOver}>
        {mode === "viewing" && selectedVenueId ? (
          <VenueView
            venueId={selectedVenueId}
            onEdit={handleEdit}
            onClose={handleCloseSlideOver}
            onAddProject={handleAddProject}
            onEditProject={handleEditProject}
            onCreateTask={handleCreateTask}
          />
        ) : mode === "editing" || mode === "creating" ? (
          <VenueDetail
            venueId={selectedVenueId}
            isCreating={mode === "creating"}
            onClose={handleCloseDetail}
          />
        ) : mode === "creating-project" || mode === "editing-project" ? (
          <ProjectDetail
            projectId={selectedProjectId}
            isCreating={mode === "creating-project"}
            defaultVenueId={selectedVenueId ?? undefined}
            onClose={handleCloseProjectDetail}
          />
        ) : mode === "creating-task" ? (
          <TaskDetail
            taskId={null}
            isCreating
            onClose={handleCloseTaskDetail}
            initialVenueIds={selectedVenueId ? [selectedVenueId] : undefined}
          />
        ) : null}
      </SlideOver>
    </div>
  );
}
