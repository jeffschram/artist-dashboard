import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { VenueList } from "./VenueList";
import { VenueDetail } from "./VenueDetail";
import { Id } from "../../convex/_generated/dataModel";

export function Dashboard() {
  const venues = useQuery(api.venues.list);
  const [selectedVenueId, setSelectedVenueId] = useState<Id<"venues"> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  if (venues === undefined) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleCreateNew = () => {
    setSelectedVenueId(null);
    setIsCreating(true);
  };

  const handleVenueSelect = (venueId: Id<"venues">) => {
    setSelectedVenueId(venueId);
    setIsCreating(false);
  };

  const handleCloseDetail = () => {
    setSelectedVenueId(null);
    setIsCreating(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Panel - Venue List */}
      <div className="w-1/3 border-r border-gray-200 bg-white">
        <VenueList
          venues={venues}
          selectedVenueId={selectedVenueId}
          onVenueSelect={handleVenueSelect}
          onCreateNew={handleCreateNew}
        />
      </div>

      {/* Right Panel - Venue Detail */}
      <div className="flex-1 bg-gray-50">
        {(selectedVenueId || isCreating) ? (
          <VenueDetail
            venueId={selectedVenueId}
            isCreating={isCreating}
            onClose={handleCloseDetail}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">🎨</div>
              <p className="text-lg">Select a venue to view details</p>
              <p className="text-sm">or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
