import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Pencil, X, ExternalLink, MapPin, Users, Phone, Mail, Check, Plus, FolderKanban, Calendar, DollarSign } from "lucide-react";
import { MarkdownEditor } from "./MarkdownEditor";
import { toast } from "sonner";

interface VenueViewProps {
  venueId: Id<"venues">;
  onEdit: () => void;
  onClose: () => void;
  onAddProject?: (venueId: Id<"venues">) => void;
  onEditProject?: (projectId: Id<"projects">) => void;
}

function getStatusColor(status: string) {
  switch (status) {
    case "Contacted": return "bg-green-100 text-green-800";
    case "To Contact": return "bg-yellow-100 text-yellow-800";
    case "Ignore": return "bg-gray-100 text-gray-800";
    case "Previous Client": return "bg-teal-100 text-teal-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "Ultimate Dream Goal": return "bg-purple-100 text-purple-800";
    case "Accessible": return "bg-blue-100 text-blue-800";
    case "Unconventional": return "bg-orange-100 text-orange-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function formatLocation(loc: { city?: string; state?: string; country?: string; phoneNumber?: string }) {
  const parts = [loc.city, loc.state, loc.country].filter(Boolean);
  return parts.join(", ");
}

function getProjectStatusStyle(status: string) {
  switch (status) {
    case "Planning": return "bg-blue-100 text-blue-800";
    case "In Progress": return "bg-yellow-100 text-yellow-800";
    case "Completed": return "bg-green-100 text-green-800";
    case "Cancelled": return "bg-gray-100 text-gray-600";
    default: return "bg-gray-100 text-gray-800";
  }
}

function formatCurrency(value: number | undefined) {
  if (value == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function VenueView({ venueId, onEdit, onClose, onAddProject, onEditProject }: VenueViewProps) {
  const venue = useQuery(api.venues.get, { id: venueId });
  const venueProjects = useQuery(api.projects.listByVenue, { venueId });
  const updateVenue = useMutation(api.venues.update);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const handleNotesChange = useCallback(
    (markdown: string) => {
      if (!venue) return;

      // Don't save if the value hasn't actually changed
      if (markdown === (venue.notes || "")) return;

      setSaveStatus("saving");
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        try {
          await updateVenue({
            id: venueId,
            name: venue.name,
            url: venue.url,
            submissionFormUrl: venue.submissionFormUrl,
            locations: venue.locations,
            contacts: venue.contacts,
            status: venue.status,
            category: venue.category,
            notes: markdown,
          });
          setSaveStatus("saved");
          if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
          savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
        } catch {
          toast.error("Failed to save notes");
          setSaveStatus("idle");
        }
      }, 1000);
    },
    [venue, venueId, updateVenue],
  );

  if (venue === undefined) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (venue === null) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Venue not found.</p>
      </div>
    );
  }

  const locationsWithData = venue.locations.filter(
    (loc) => loc.city || loc.state || loc.country,
  );

  const contactsWithData = venue.contacts.filter(
    (c) => c.name || c.title || c.email || c.notes,
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-gray-900 truncate">
              {venue.name}
            </h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span
                className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(venue.status)}`}
              >
                {venue.status}
              </span>
              <span
                className={`px-2.5 py-1 text-xs font-medium rounded-full ${getCategoryColor(venue.category)}`}
              >
                {venue.category}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Pencil size={16} />
              Edit
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
        {/* Links */}
        {(venue.url || venue.submissionFormUrl) && (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Links</h3>
            <div className="space-y-2">
              {venue.url && (
                <a
                  href={venue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ExternalLink size={15} />
                  <span className="truncate">{venue.url}</span>
                </a>
              )}
              {venue.submissionFormUrl && (
                <a
                  href={venue.submissionFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ExternalLink size={15} />
                  <span className="truncate">
                    Submission Form: {venue.submissionFormUrl}
                  </span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Locations */}
        {locationsWithData.length > 0 && (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Locations
            </h3>
            <div className="space-y-2">
              {locationsWithData.map((loc, i) => (
                <div key={i} className="flex items-start gap-2">
                  <MapPin
                    size={15}
                    className="text-gray-400 mt-0.5 shrink-0"
                  />
                  <div>
                    <span className="text-gray-900">
                      {formatLocation(loc)}
                    </span>
                    {loc.phoneNumber && (
                      <span className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                        <Phone size={12} />
                        {loc.phoneNumber}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contacts */}
        {contactsWithData.length > 0 && (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Contacts
            </h3>
            <div className="space-y-3">
              {contactsWithData.map((contact, i) => (
                <div
                  key={i}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  {contact.name && (
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {contact.name}
                      </span>
                    </div>
                  )}
                  {contact.title && (
                    <p className="text-sm text-gray-600 ml-[22px]">
                      {contact.title}
                    </p>
                  )}
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mt-1 ml-[22px]"
                    >
                      <Mail size={12} />
                      {contact.email}
                    </a>
                  )}
                  {contact.notes && (
                    <p className="text-sm text-gray-500 mt-1 ml-[22px]">
                      {contact.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects — only for Previous Client venues */}
        {venue.status === "Previous Client" && (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <FolderKanban size={18} className="text-gray-400" />
                Projects
              </h3>
              {onAddProject && (
                <button
                  onClick={() => onAddProject(venueId)}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={14} />
                  Add Project
                </button>
              )}
            </div>
            {venueProjects && venueProjects.length > 0 ? (
              <div className="space-y-2">
                {venueProjects.map((project) => (
                  <button
                    key={project._id}
                    onClick={() => onEditProject?.(project._id)}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {project.name}
                      </span>
                      <span className={`shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${getProjectStatusStyle(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-1.5">
                      {(project.startDate || project.endDate) && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {project.startDate || "?"} — {project.endDate || "?"}
                        </span>
                      )}
                      {formatCurrency(project.budget) && (
                        <span className="flex items-center gap-1">
                          <DollarSign size={11} />
                          {formatCurrency(project.budget)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No projects yet. Add one to track your work with this venue.
              </p>
            )}
          </div>
        )}

        {/* Notes - always shown with editable markdown editor */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">Notes</h3>
            {saveStatus === "saving" && (
              <span className="text-xs text-gray-400 animate-pulse">
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <Check size={12} />
                Saved
              </span>
            )}
          </div>
          <MarkdownEditor
            content={venue.notes || ""}
            onChange={handleNotesChange}
            placeholder="Add your notes about this venue..."
          />
        </div>
      </div>
    </div>
  );
}
