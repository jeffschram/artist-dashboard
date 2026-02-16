import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { X, Save, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { MarkdownEditor } from "./MarkdownEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Combobox,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { createTrelloCard } from "@/lib/trello";

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
  const allContacts = useQuery(api.contacts.list);
  const linkedContactIds = useQuery(
    api.projects.listContactsByProject,
    projectId ? { projectId } : "skip",
  );
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const deleteProject = useMutation(api.projects.remove);
  const linkContact = useMutation(api.projects.linkContact);
  const unlinkContact = useMutation(api.projects.unlinkContact);

  const [formData, setFormData] = useState({
    name: "",
    venueIds: [] as string[],
    startDate: "",
    endDate: "",
    description: "",
    status: "Planning" as ProjectStatus,
    notes: "",
    budget: "",
    profit: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<Id<"contacts">[]>([]);
  const venuesAnchor = useComboboxAnchor();
  const peopleAnchor = useComboboxAnchor();

  useEffect(() => {
    if (linkedContactIds) {
      setSelectedContactIds(linkedContactIds);
    }
  }, [linkedContactIds]);

  useEffect(() => {
    if (project && !isCreating) {
      setFormData({
        name: project.name,
        venueIds: project.venueIds || [],
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
        venueIds: defaultVenueId ? [defaultVenueId] : [],
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

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        venueIds: formData.venueIds as Id<"venues">[],
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        description: formData.description || undefined,
        status: formData.status,
        notes: formData.notes || undefined,
        budget: formData.budget ? Number(formData.budget) : undefined,
        profit: formData.profit ? Number(formData.profit) : undefined,
      };

      if (isCreating) {
        const newProjectId = await createProject(payload);
        
        // Link selected contacts to the new project
        for (const contactId of selectedContactIds) {
          await linkContact({ projectId: newProjectId, contactId });
        }
        
        toast.success("Project created");
      } else if (projectId) {
        await updateProject({ id: projectId, ...payload });
        
        // Update contact links
        const currentContactIds = linkedContactIds || [];
        const added = selectedContactIds.filter((id) => !currentContactIds.includes(id));
        const removed = currentContactIds.filter((id) => !selectedContactIds.includes(id));
        
        for (const contactId of added) {
          await linkContact({ projectId, contactId });
        }
        for (const contactId of removed) {
          await unlinkContact({ projectId, contactId });
        }
        
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

  const handleCreateTrelloCard = async () => {
    if (!project || !projectId || isCreatingCard) return;

    setIsCreatingCard(true);
    try {
      const description = `Project: ${project.name}`;

      const result = await createTrelloCard(`Project: ${project.name}`, description);
      toast.success("Trello card created successfully!", {
        description: "Card added to Today list",
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

  const allVenues = venues ?? [];

  if (project === undefined && !isCreating) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-background">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {isCreating ? "New Project" : "Edit Project"}
          </h2>
          <div className="flex items-center gap-2">
            {!isCreating && projectId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateTrelloCard}
                disabled={isCreatingCard}
              >
                <ExternalLink className="h-4 w-4" />
                {isCreatingCard ? "Creating..." : "Create Trello Card"}
              </Button>
            )}
            {!isCreating && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Enter project name"
              />
            </div>

            <div className="space-y-2">
              <Label>Venues (optional)</Label>
              <Combobox
                multiple
                items={allVenues.map((v) => v._id)}
                itemToStringValue={(id) => {
                  const v = allVenues.find((v) => v._id === id);
                  return v?.name ?? "";
                }}
                value={formData.venueIds}
                onValueChange={(ids) =>
                  setFormData((p) => ({ ...p, venueIds: ids }))
                }
              >
                <ComboboxChips ref={venuesAnchor}>
                  <ComboboxValue>
                    {(values: string[]) => (
                      <>
                        {values.map((id) => {
                          const v = allVenues.find((v) => v._id === id);
                          return (
                            <ComboboxChip key={id}>
                              {v?.name ?? "Unknown"}
                            </ComboboxChip>
                          );
                        })}
                        <ComboboxChipsInput placeholder="Search venues..." />
                      </>
                    )}
                  </ComboboxValue>
                </ComboboxChips>
                <ComboboxContent anchor={venuesAnchor}>
                  <ComboboxEmpty>No venues found.</ComboboxEmpty>
                  <ComboboxList>
                    {(id: string) => {
                      const v = allVenues.find((v) => v._id === id);
                      return (
                        <ComboboxItem key={id} value={id}>
                          {v?.name}
                        </ComboboxItem>
                      );
                    }}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData((p) => ({
                      ...p,
                      status: v as ProjectStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Short description"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, startDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, endDate: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Budget ($)</Label>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, budget: e.target.value }))
                  }
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>Profit ($)</Label>
                <Input
                  type="number"
                  value={formData.profit}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, profit: e.target.value }))
                  }
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* People */}
        <Card>
          <CardHeader>
            <CardTitle>People</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Link people to this project</Label>
              <Combobox
                multiple
                items={(allContacts ?? []).map((c) => c._id)}
                itemToStringValue={(id) => {
                  const c = allContacts?.find((c) => c._id === id);
                  return c?.name ?? "";
                }}
                value={selectedContactIds}
                onValueChange={(ids) =>
                  setSelectedContactIds(ids as Id<"contacts">[])
                }
              >
                <ComboboxChips ref={peopleAnchor}>
                  <ComboboxValue>
                    {(values: string[]) => (
                      <>
                        {values.map((id) => {
                          const c = allContacts?.find((c) => c._id === id);
                          return (
                            <ComboboxChip key={id}>
                              {c?.name ?? "Unknown"}
                            </ComboboxChip>
                          );
                        })}
                        <ComboboxChipsInput placeholder="Search people..." />
                      </>
                    )}
                  </ComboboxValue>
                </ComboboxChips>
                <ComboboxContent anchor={peopleAnchor}>
                  <ComboboxEmpty>No people found.</ComboboxEmpty>
                  <ComboboxList>
                    {(id: string) => {
                      const contact = allContacts?.find((c) => c._id === id);
                      return (
                        <ComboboxItem key={id} value={id}>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {contact?.name}
                            </div>
                            {contact?.role && (
                              <div className="text-xs text-muted-foreground">
                                {contact.role}
                              </div>
                            )}
                          </div>
                        </ComboboxItem>
                      );
                    }}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <MarkdownEditor
              content={formData.notes}
              onChange={(markdown) =>
                setFormData((p) => ({ ...p, notes: markdown }))
              }
              placeholder="Add project notes..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
