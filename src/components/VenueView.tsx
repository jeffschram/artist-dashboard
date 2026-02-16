import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Pencil,
  X,
  ExternalLink,
  MapPin,
  Users,
  Phone,
  Mail,
  Check,
  Plus,
  FolderKanban,
  Calendar,
  DollarSign,
} from "lucide-react";
import { MarkdownEditor } from "./MarkdownEditor";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createTrelloCard } from "@/lib/trello";

interface VenueViewProps {
  venueId: Id<"venues">;
  onEdit: () => void;
  onClose: () => void;
  onAddProject?: (venueId: Id<"venues">) => void;
  onEditProject?: (projectId: Id<"projects">) => void;
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "Contacted":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "To Contact":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "Ignore":
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    case "Previous Client":
      return "bg-teal-100 text-teal-800 hover:bg-teal-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
}

function getCategoryBadgeClass(category: string) {
  switch (category) {
    case "Ultimate Dream Goal":
      return "bg-purple-100 text-purple-800 hover:bg-purple-100";
    case "Accessible":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "Unconventional":
      return "bg-orange-100 text-orange-800 hover:bg-orange-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
}

function formatLocation(loc: {
  city?: string;
  state?: string;
  country?: string;
  phoneNumber?: string;
}) {
  const parts = [loc.city, loc.state, loc.country].filter(Boolean);
  return parts.join(", ");
}

function getProjectStatusBadgeClass(status: string) {
  switch (status) {
    case "Planning":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "In Progress":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "Completed":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "Cancelled":
      return "bg-gray-100 text-gray-600 hover:bg-gray-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
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

export function VenueView({
  venueId,
  onEdit,
  onClose,
  onAddProject,
  onEditProject,
}: VenueViewProps) {
  const venue = useQuery(api.venues.get, { id: venueId });
  const venueProjects = useQuery(api.projects.listByVenue, { venueId });
  const venueContacts = useQuery(api.contacts.listByVenue, { venueId });
  const updateVenue = useMutation(api.venues.update);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const handleNotesChange = useCallback(
    (markdown: string) => {
      if (!venue) return;

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
            contacts: venue.contacts || [],
            contactIds: venue.contactIds || [],
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

  const handleCreateTrelloCard = async () => {
    if (!venue || isCreatingCard) return;

    setIsCreatingCard(true);
    try {
      const location = venue.locations[0];
      const locationStr = location
        ? [location.city, location.state, location.country]
            .filter(Boolean)
            .join(", ")
        : "";

      const description = [
        `Venue: ${venue.name}`,
        venue.url ? `URL: ${venue.url}` : "",
        locationStr ? `Location: ${locationStr}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const result = await createTrelloCard(
        `⚡ Venue Review: ${venue.name}`,
        description,
      );
      toast.success("Trello card created successfully!", {
        description: "Card added to TODAY'S INTENTIONS",
        action: {
          label: "View",
          onClick: () => window.open(result.url, "_blank"),
        },
      });
    } catch (error) {
      console.error("Failed to create Trello card:", error);
      toast.error("Failed to create Trello card");
    } finally {
      setIsCreatingCard(false);
    }
  };

  if (venue === undefined) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (venue === null) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Venue not found.</p>
      </div>
    );
  }

  const locationsWithData = venue.locations.filter(
    (loc) => loc.city || loc.state || loc.country,
  );

  const contactsWithData = venueContacts || [];

  const projectsWithData = venueProjects || [];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-background">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold truncate">{venue.name}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge
                variant="secondary"
                className={cn("border-0", getStatusBadgeClass(venue.status))}
              >
                {venue.status}
              </Badge>
              <Badge
                variant="secondary"
                className={cn(
                  "border-0",
                  getCategoryBadgeClass(venue.category),
                )}
              >
                {venue.category}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateTrelloCard}
              disabled={isCreatingCard}
            >
              <ExternalLink className="h-4 w-4" />
              {isCreatingCard ? "Creating..." : "Create Trello Card"}
            </Button>
            <Button onClick={onEdit} size="sm">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Links */}
        {(venue.url || venue.submissionFormUrl) && (
          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {venue.url && (
                <a
                  href={venue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="truncate">{venue.url}</span>
                </a>
              )}
              {venue.submissionFormUrl && (
                <a
                  href={venue.submissionFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="truncate">
                    Submission Form: {venue.submissionFormUrl}
                  </span>
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* Locations */}
        {locationsWithData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Locations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {locationsWithData.map((loc, i) => (
                <div key={i} className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <span>{formatLocation(loc)}</span>
                    {loc.phoneNumber && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                        <Phone className="h-3 w-3" />
                        {loc.phoneNumber}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* People */}
        {contactsWithData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>People</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contactsWithData.map((contact) => (
                <div
                  key={contact._id}
                  className="p-3 bg-muted rounded-lg border"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{contact.name}</span>
                  </div>
                  {contact.role && (
                    <p className="text-sm text-muted-foreground ml-[22px]">
                      {contact.role}
                    </p>
                  )}
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 mt-1 ml-[22px]"
                    >
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground mt-1 ml-[22px]">
                      <Phone className="h-3 w-3" />
                      {contact.phone}
                    </p>
                  )}
                  {contact.notes && (
                    <p className="text-sm text-muted-foreground mt-1 ml-[22px]">
                      {contact.notes}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Projects */}
        {projectsWithData.length > 0 && (
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {projectsWithData.map((project) => (
                  <button
                    key={project._id}
                    onClick={() => onEditProject?.(project._id)}
                    className="w-full text-left p-3 bg-muted rounded-lg border hover:border-primary/30 hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium group-hover:text-primary transition-colors">
                        {project.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "border-0 shrink-0",
                          getProjectStatusBadgeClass(project.status),
                        )}
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5">
                      {(project.startDate || project.endDate) && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {project.startDate || "?"} — {project.endDate || "?"}
                        </span>
                      )}
                      {formatCurrency(project.budget) && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(project.budget)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Notes</CardTitle>
            {saveStatus === "saving" && (
              <span className="text-xs text-muted-foreground animate-pulse">
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <Check className="h-3 w-3" />
                Saved
              </span>
            )}
          </CardHeader>
          <CardContent>
            <MarkdownEditor
              content={venue.notes || ""}
              onChange={handleNotesChange}
              placeholder="Add your notes about this venue..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
