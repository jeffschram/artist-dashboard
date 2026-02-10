import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { VenueBoard } from "./VenueBoard";
import { VenueView } from "./VenueView";
import { VenueDetail } from "./VenueDetail";
import { SlideOver } from "./SlideOver";
import { Id } from "../../convex/_generated/dataModel";

type Mode = "idle" | "viewing" | "editing" | "creating";

export function Dashboard() {
  const venues = useQuery(api.venues.list);
  const [selectedVenueId, setSelectedVenueId] = useState<Id<"venues"> | null>(null);
  const [mode, setMode] = useState<Mode>("idle");

  if (venues === undefined) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
    setMode("idle");
  };

  const handleCloseDetail = () => {
    if (mode === "editing" && selectedVenueId) {
      // Return to viewing after save/cancel from edit
      setMode("viewing");
    } else {
      // Creating -> go back to idle
      setSelectedVenueId(null);
      setMode("idle");
    }
  };

  const isSlideOverOpen = mode !== "idle";

  return (
    <div className="h-[calc(100vh-4rem)]">
      {/* Full-width board */}
      <VenueBoard
        venues={venues}
        selectedVenueId={selectedVenueId}
        onVenueSelect={handleVenueSelect}
        onCreateNew={handleCreateNew}
      />

      {/* Slide-over drawer for detail / edit / create */}
      <SlideOver isOpen={isSlideOverOpen} onClose={handleCloseSlideOver}>
        {mode === "viewing" && selectedVenueId ? (
          <VenueView
            venueId={selectedVenueId}
            onEdit={handleEdit}
            onClose={handleCloseSlideOver}
          />
        ) : (mode === "editing" || mode === "creating") ? (
          <VenueDetail
            venueId={selectedVenueId}
            isCreating={mode === "creating"}
            onClose={handleCloseDetail}
          />
        ) : null}
      </SlideOver>
    </div>
  );
}
