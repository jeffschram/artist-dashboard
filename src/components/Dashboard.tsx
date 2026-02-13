import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { VenueBoard } from "./VenueBoard";
import { VenueView } from "./VenueView";
import { VenueDetail } from "./VenueDetail";
import { ProjectDetail } from "./ProjectDetail";
import { TaskDetail } from "./TaskDetail";
import { OutreachDetail } from "./OutreachDetail";
import { SlideOver } from "./SlideOver";
import { Id } from "../../convex/_generated/dataModel";

type Mode =
  | "idle"
  | "viewing"
  | "editing"
  | "creating"
  | "creating-project"
  | "editing-project"
  | "creating-task"
  | "creating-outreach";

interface DashboardProps {
  initialEntityId?: string;
  onNavigationConsumed?: () => void;
}

export function Dashboard({ initialEntityId, onNavigationConsumed }: DashboardProps) {
  const venues = useQuery(api.venues.list);
  const [selectedVenueId, setSelectedVenueId] = useState<Id<"venues"> | null>(
    null,
  );
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);
  const [mode, setMode] = useState<Mode>("idle");

  useEffect(() => {
    if (initialEntityId && venues) {
      const found = venues.find((v) => v._id === initialEntityId);
      if (found) {
        setSelectedVenueId(found._id);
        setMode("viewing");
      }
      onNavigationConsumed?.();
    }
  }, [initialEntityId, venues, onNavigationConsumed]);

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

  const handleLogOutreach = (_venueId: Id<"venues">) => {
    setMode("creating-outreach");
  };

  const handleCloseOutreachDetail = () => {
    if (selectedVenueId) {
      setMode("viewing");
    } else {
      setMode("idle");
    }
  };

  const isSlideOverOpen = mode !== "idle";

  return (
    <div className="h-screen">
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
            onLogOutreach={handleLogOutreach}
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
        ) : mode === "creating-outreach" ? (
          <OutreachDetail
            outreachId={null}
            isCreating
            onClose={handleCloseOutreachDetail}
            initialVenueId={selectedVenueId ?? undefined}
          />
        ) : null}
      </SlideOver>
    </div>
  );
}
