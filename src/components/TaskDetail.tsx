import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { X, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MarkdownEditor } from "./MarkdownEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface TaskDetailProps {
  taskId: Id<"tasks"> | null;
  isCreating: boolean;
  onClose: () => void;
}

type TaskStatus = "To Do" | "In Progress" | "Completed" | "Cancelled";
type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export function TaskDetail({ taskId, isCreating, onClose }: TaskDetailProps) {
  const task = useQuery(api.tasks.get, taskId ? { id: taskId } : "skip");
  const venues = useQuery(api.venues.list);
  const projects = useQuery(api.projects.list);
  const contacts = useQuery(api.contacts.list);
  
  const linkedVenueIds = useQuery(
    api.tasks.listVenuesByTask,
    taskId ? { taskId } : "skip",
  );
  const linkedProjectIds = useQuery(
    api.tasks.listProjectsByTask,
    taskId ? { taskId } : "skip",
  );
  const linkedContactIds = useQuery(
    api.tasks.listContactsByTask,
    taskId ? { taskId } : "skip",
  );

  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const deleteTask = useMutation(api.tasks.remove);
  const linkVenue = useMutation(api.tasks.linkVenue);
  const unlinkVenue = useMutation(api.tasks.unlinkVenue);
  const linkProject = useMutation(api.tasks.linkProject);
  const unlinkProject = useMutation(api.tasks.unlinkProject);
  const linkContact = useMutation(api.tasks.linkContact);
  const unlinkContact = useMutation(api.tasks.unlinkContact);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "To Do" as TaskStatus,
    priority: "Medium" as TaskPriority,
    dueDate: "",
    completedDate: "",
    notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedVenueIds, setSelectedVenueIds] = useState<Id<"venues">[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Id<"projects">[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<Id<"contacts">[]>([]);
  
  const venuesAnchor = useComboboxAnchor();
  const projectsAnchor = useComboboxAnchor();
  const peopleAnchor = useComboboxAnchor();

  useEffect(() => {
    if (linkedVenueIds) {
      setSelectedVenueIds(linkedVenueIds);
    }
  }, [linkedVenueIds]);

  useEffect(() => {
    if (linkedProjectIds) {
      setSelectedProjectIds(linkedProjectIds);
    }
  }, [linkedProjectIds]);

  useEffect(() => {
    if (linkedContactIds) {
      setSelectedContactIds(linkedContactIds);
    }
  }, [linkedContactIds]);

  useEffect(() => {
    if (task && !isCreating) {
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate || "",
        completedDate: task.completedDate || "",
        notes: task.notes || "",
      });
    } else if (isCreating) {
      setFormData({
        title: "",
        description: "",
        status: "To Do",
        priority: "Medium",
        dueDate: "",
        completedDate: "",
        notes: "",
      });
    }
  }, [task, isCreating]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate || undefined,
        completedDate: formData.completedDate || undefined,
        notes: formData.notes || undefined,
      };

      if (isCreating) {
        const newTaskId = await createTask(payload);
        
        // Link venues
        for (const venueId of selectedVenueIds) {
          await linkVenue({ taskId: newTaskId, venueId });
        }
        // Link projects
        for (const projectId of selectedProjectIds) {
          await linkProject({ taskId: newTaskId, projectId });
        }
        // Link contacts
        for (const contactId of selectedContactIds) {
          await linkContact({ taskId: newTaskId, contactId });
        }
        
        toast.success("Task created");
      } else if (taskId) {
        await updateTask({ id: taskId, ...payload });
        
        // Update venue links
        const currentVenueIds = linkedVenueIds || [];
        const addedVenues = selectedVenueIds.filter((id) => !currentVenueIds.includes(id));
        const removedVenues = currentVenueIds.filter((id) => !selectedVenueIds.includes(id));
        for (const venueId of addedVenues) {
          await linkVenue({ taskId, venueId });
        }
        for (const venueId of removedVenues) {
          await unlinkVenue({ taskId, venueId });
        }
        
        // Update project links
        const currentProjectIds = linkedProjectIds || [];
        const addedProjects = selectedProjectIds.filter((id) => !currentProjectIds.includes(id));
        const removedProjects = currentProjectIds.filter((id) => !selectedProjectIds.includes(id));
        for (const projectId of addedProjects) {
          await linkProject({ taskId, projectId });
        }
        for (const projectId of removedProjects) {
          await unlinkProject({ taskId, projectId });
        }
        
        // Update contact links
        const currentContactIds = linkedContactIds || [];
        const addedContacts = selectedContactIds.filter((id) => !currentContactIds.includes(id));
        const removedContacts = currentContactIds.filter((id) => !selectedContactIds.includes(id));
        for (const contactId of addedContacts) {
          await linkContact({ taskId, contactId });
        }
        for (const contactId of removedContacts) {
          await unlinkContact({ taskId, contactId });
        }
        
        toast.success("Task updated");
      }
      onClose();
    } catch {
      toast.error("Failed to save task");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!taskId || isCreating) return;
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask({ id: taskId });
        toast.success("Task deleted");
        onClose();
      } catch {
        toast.error("Failed to delete task");
      }
    }
  };

  if (!isCreating && task === undefined) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const allVenues = venues ?? [];
  const allProjects = projects ?? [];
  const allContacts = contacts ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-xl font-semibold">
          {isCreating ? "New Task" : "Edit Task"}
        </h2>
        <div className="flex items-center gap-2">
          {!isCreating && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isSaving}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Task title"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Brief description of the task"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, status: v as TaskStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="To Do">To Do</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, priority: v as TaskPriority }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, dueDate: e.target.value }))
                  }
                />
              </div>
              {formData.status === "Completed" && (
                <div className="space-y-2">
                  <Label>Completed Date</Label>
                  <Input
                    type="date"
                    value={formData.completedDate}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        completedDate: e.target.value,
                      }))
                    }
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Venues */}
        <Card>
          <CardHeader>
            <CardTitle>Venues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Link venues to this task (optional)</Label>
              <Combobox
                multiple
                items={allVenues.map((v) => v._id)}
                itemToStringValue={(id) => {
                  const v = allVenues.find((v) => v._id === id);
                  return v?.name ?? "";
                }}
                value={selectedVenueIds}
                onValueChange={(ids) =>
                  setSelectedVenueIds(ids as Id<"venues">[])
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
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Link projects to this task (optional)</Label>
              <Combobox
                multiple
                items={allProjects.map((p) => p._id)}
                itemToStringValue={(id) => {
                  const p = allProjects.find((p) => p._id === id);
                  return p?.name ?? "";
                }}
                value={selectedProjectIds}
                onValueChange={(ids) =>
                  setSelectedProjectIds(ids as Id<"projects">[])
                }
              >
                <ComboboxChips ref={projectsAnchor}>
                  <ComboboxValue>
                    {(values: string[]) => (
                      <>
                        {values.map((id) => {
                          const p = allProjects.find((p) => p._id === id);
                          return (
                            <ComboboxChip key={id}>
                              {p?.name ?? "Unknown"}
                            </ComboboxChip>
                          );
                        })}
                        <ComboboxChipsInput placeholder="Search projects..." />
                      </>
                    )}
                  </ComboboxValue>
                </ComboboxChips>
                <ComboboxContent anchor={projectsAnchor}>
                  <ComboboxEmpty>No projects found.</ComboboxEmpty>
                  <ComboboxList>
                    {(id: string) => {
                      const project = allProjects.find((p) => p._id === id);
                      return (
                        <ComboboxItem key={id} value={id}>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {project?.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {project?.status}
                            </div>
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

        {/* People */}
        <Card>
          <CardHeader>
            <CardTitle>People</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Assign people to this task (optional)</Label>
              <Combobox
                multiple
                items={allContacts.map((c) => c._id)}
                itemToStringValue={(id) => {
                  const c = allContacts.find((c) => c._id === id);
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
                          const c = allContacts.find((c) => c._id === id);
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
                      const contact = allContacts.find((c) => c._id === id);
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
              placeholder="Add notes about this task..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
