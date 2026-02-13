import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { SlideOver } from "./SlideOver";
import { PersonDetail } from "./PersonDetail";
import { TaskDetail } from "./TaskDetail";
import { PeopleTable } from "./PeopleTable";
import { Plus, Search, Mail, Phone, Building2, UserCircle, LayoutGrid, Table as TableIcon, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PERSON_TYPES, getPersonTypeBadgeClass } from "@/lib/personTypes";
import { cn } from "@/lib/utils";

type Mode = "idle" | "editing" | "creating" | "creating-task";
type ViewMode = "cards" | "table";

interface PeopleDashboardProps {
  initialEntityId?: string;
  onNavigationConsumed?: () => void;
}

export function PeopleDashboard({ initialEntityId, onNavigationConsumed }: PeopleDashboardProps) {
  const contacts = useQuery(api.contacts.list);
  const venues = useQuery(api.venues.list);
  const projects = useQuery(api.projects.list);
  const projectContactLinks = useQuery(api.projects.getAllProjectContactLinks);
  const [selectedContactId, setSelectedContactId] =
    useState<Id<"contacts"> | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    if (initialEntityId && contacts) {
      const found = contacts.find((c) => c._id === initialEntityId);
      if (found) {
        setSelectedContactId(found._id);
        setMode("editing");
      }
      onNavigationConsumed?.();
    }
  }, [initialEntityId, contacts, onNavigationConsumed]);

  if (contacts === undefined || venues === undefined || projects === undefined || projectContactLinks === undefined) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const venueMap = new Map(venues.map((v) => [v._id, v.name]));
  const projectMap = new Map(projects.map((p) => [p._id, p.name]));
  
  // Create a map of contactId -> projectIds
  const contactToProjects = new Map<Id<"contacts">, Id<"projects">[]>();
  for (const link of projectContactLinks) {
    const existing = contactToProjects.get(link.contactId) || [];
    contactToProjects.set(link.contactId, [...existing, link.projectId]);
  }

  const filtered = contacts.filter((c) => {
    // Type filter
    if (typeFilter !== "all" && !(c.types || []).includes(typeFilter)) {
      return false;
    }
    
    // Search filter
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const venueNames = (c.venueIds || []).map((id) => venueMap.get(id) || "").join(" ");
    const types = (c.types || []).join(" ");
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.role || "").toLowerCase().includes(q) ||
      types.toLowerCase().includes(q) ||
      venueNames.toLowerCase().includes(q)
    );
  });

  // Calculate type counts
  const typeCounts = contacts.reduce(
    (acc, c) => {
      (c.types || []).forEach((type) => {
        acc[type] = (acc[type] || 0) + 1;
      });
      return acc;
    },
    {} as Record<string, number>,
  );

  const handleSelect = (id: Id<"contacts">) => {
    setSelectedContactId(id);
    setMode("editing");
  };

  const handleCreate = () => {
    setSelectedContactId(null);
    setMode("creating");
  };

  const handleClose = () => {
    setSelectedContactId(null);
    setMode("idle");
  };

  const handleCreateTask = (contactId: Id<"contacts">) => {
    setSelectedContactId(contactId);
    setMode("creating-task");
  };

  const handleCloseTaskDetail = () => {
    // Return to person edit view
    if (selectedContactId) {
      setMode("editing");
    } else {
      setMode("idle");
    }
  };

  return (
    <div className="h-screen">
      {/* Toolbar */}
      <div className="px-6 py-4 bg-background border-b space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people..."
              className="pl-9"
            />
          </div>

          {/* View mode toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as ViewMode)}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="cards" aria-label="Cards view" className="gap-1.5 text-xs">
              <LayoutGrid className="h-3.5 w-3.5" />
              Cards
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view" className="gap-1.5 text-xs">
              <TableIcon className="h-3.5 w-3.5" />
              Table
            </ToggleGroupItem>
          </ToggleGroup>

          <span className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length !== 1 ? "people" : "person"}
          </span>

          <Button onClick={handleCreate} size="sm" className="ml-auto">
            <Plus className="h-4 w-4" />
            New Person
          </Button>
        </div>

        {/* Type filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={typeFilter === "all" ? "default" : "secondary"}
            size="sm"
            className="rounded-full text-xs"
            onClick={() => setTypeFilter("all")}
          >
            All ({contacts.length})
          </Button>
          {PERSON_TYPES.map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-full text-xs",
                typeFilter !== type && "border-0",
                typeFilter !== type && getPersonTypeBadgeClass(type),
              )}
              onClick={() => setTypeFilter(type)}
            >
              {type} ({typeCounts[type] || 0})
            </Button>
          ))}
        </div>
      </div>

      {/* People list */}
      {viewMode === "cards" && (
        <div className="flex-1 overflow-y-auto p-6">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg font-medium">No people found</p>
              <p className="text-sm mt-1">
                {contacts.length === 0
                  ? 'Add your first person by clicking "New Person"'
                  : "Try adjusting your search"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((contact) => {
                const venueNames = (contact.venueIds || [])
                  .map((id) => venueMap.get(id))
                  .filter(Boolean);
                const projectIds = contactToProjects.get(contact._id) || [];
                const projectNames = projectIds
                  .map((id) => projectMap.get(id))
                  .filter(Boolean);
                return (
                  <button
                    key={contact._id}
                    onClick={() => handleSelect(contact._id)}
                    className="text-left bg-card p-5 rounded-xl border hover:border-primary/30 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                          {contact.name}
                        </h3>
                        {contact.role && (
                          <p className="text-sm text-muted-foreground truncate">
                            {contact.role}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      {contact.types && contact.types.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {contact.types.slice(0, 3).map((type) => (
                            <Badge
                              key={type}
                              variant="secondary"
                              className={cn("text-xs border-0", getPersonTypeBadgeClass(type))}
                            >
                              {type}
                            </Badge>
                          ))}
                          {contact.types.length > 3 && (
                            <span className="text-xs text-muted-foreground self-center">
                              +{contact.types.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {venueNames.length > 0 && (
                        <div className="flex items-center gap-2 text-muted-foreground pt-1 border-t mt-2">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {venueNames.join(", ")}
                          </span>
                        </div>
                      )}
                      {projectNames.length > 0 && (
                        <div className="flex items-center gap-2 text-muted-foreground pt-1 border-t mt-2">
                          <Briefcase className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {projectNames.slice(0, 2).join(", ")}
                            {projectNames.length > 2 && ` +${projectNames.length - 2}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* People table */}
      {viewMode === "table" && (
        <div className="flex-1 overflow-hidden">
          <PeopleTable
            contacts={filtered}
            venueMap={venueMap}
            projectMap={projectMap}
            contactToProjects={contactToProjects}
            onContactSelect={handleSelect}
          />
        </div>
      )}

      {/* Slide-over */}
      <SlideOver isOpen={mode !== "idle"} onClose={handleClose}>
        {mode === "creating-task" ? (
          <TaskDetail
            taskId={null}
            isCreating
            onClose={handleCloseTaskDetail}
            initialContactIds={selectedContactId ? [selectedContactId] : undefined}
          />
        ) : (
          <PersonDetail
            contactId={selectedContactId}
            isCreating={mode === "creating"}
            onClose={handleClose}
            onCreateTask={handleCreateTask}
          />
        )}
      </SlideOver>
    </div>
  );
}
