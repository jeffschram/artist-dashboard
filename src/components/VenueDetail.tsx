import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { X, Plus, Trash2, Save, ExternalLink, Search } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
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

interface VenueDetailProps {
  venueId: Id<"venues"> | null;
  isCreating: boolean;
  onClose: () => void;
}

interface Location {
  city?: string;
  state?: string;
  country?: string;
  phoneNumber?: string;
}

export function VenueDetail({ venueId, isCreating, onClose }: VenueDetailProps) {
  const venue = useQuery(api.venues.get, venueId ? { id: venueId } : "skip");
  const linkedContacts = useQuery(
    api.contacts.listByVenue,
    venueId ? { venueId } : "skip",
  );
  const allContacts = useQuery(api.contacts.list);
  const allProjects = useQuery(api.projects.list);
  const linkedProjects = useQuery(
    api.projects.listByVenue,
    venueId ? { venueId } : "skip",
  );
  const createVenue = useMutation(api.venues.create);
  const updateVenue = useMutation(api.venues.update);
  const deleteVenue = useMutation(api.venues.remove);
  const createContact = useMutation(api.contacts.create);
  const updateContact = useMutation(api.contacts.update);
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);

  const [formData, setFormData] = useState({
    name: "",
    url: "",
    submissionFormUrl: "",
    locations: [{ city: "", state: "", country: "", phoneNumber: "" }] as Location[],
    status: "To Contact" as "Contacted" | "To Contact" | "Ignore" | "Previous Client",
    category: "Accessible" as "Ultimate Dream Goal" | "Accessible" | "Unconventional",
    notes: "",
  });

  const [selectedContactIds, setSelectedContactIds] = useState<Id<"contacts">[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Id<"projects">[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    status: "Planning" as "Planning" | "In Progress" | "Completed" | "Cancelled",
    description: "",
    startDate: "",
    endDate: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (venue && !isCreating) {
      setFormData({
        name: venue.name,
        url: venue.url || "",
        submissionFormUrl: venue.submissionFormUrl || "",
        locations: venue.locations.length > 0 ? venue.locations : [{ city: "", state: "", country: "", phoneNumber: "" }],
        status: venue.status,
        category: venue.category,
        notes: venue.notes || "",
      });
    } else if (isCreating) {
      setFormData({
        name: "",
        url: "",
        submissionFormUrl: "",
        locations: [{ city: "", state: "", country: "", phoneNumber: "" }],
        status: "To Contact",
        category: "Accessible",
        notes: "",
      });
    }
  }, [venue, isCreating]);

  useEffect(() => {
    if (linkedContacts) {
      setSelectedContactIds(linkedContacts.map((c) => c._id));
    }
  }, [linkedContacts]);

  useEffect(() => {
    if (linkedProjects) {
      setSelectedProjectIds(linkedProjects.map((p) => p._id));
    }
  }, [linkedProjects]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Venue name is required");
      return;
    }

    setIsSaving(true);
    try {
      if (isCreating) {
        const newVenueId = await createVenue({
          ...formData,
          contacts: [],
          contactIds: selectedContactIds,
        });
        
        for (const contactId of selectedContactIds) {
          const contact = allContacts?.find((c) => c._id === contactId);
          if (contact) {
            await updateContact({
              id: contactId,
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
              role: contact.role,
              notes: contact.notes,
              venueIds: [...(contact.venueIds || []), newVenueId],
            });
          }
        }

        // Link selected projects to this new venue
        for (const projectId of selectedProjectIds) {
          const project = allProjects?.find((p) => p._id === projectId);
          if (project) {
            await updateProject({
              id: projectId,
              name: project.name,
              status: project.status,
              venueIds: [...(project.venueIds || []), newVenueId],
              startDate: project.startDate,
              endDate: project.endDate,
              description: project.description,
              notes: project.notes,
              budget: project.budget,
              profit: project.profit,
            });
          }
        }
        toast.success("Venue created successfully");
      } else if (venueId) {
        await updateVenue({
          id: venueId,
          ...formData,
          contacts: venue?.contacts || [],
          contactIds: selectedContactIds,
        });

        const previousContactIds = (linkedContacts || []).map((c) => c._id);
        const added = selectedContactIds.filter((id) => !previousContactIds.includes(id));
        const removed = previousContactIds.filter((id) => !selectedContactIds.includes(id));

        for (const contactId of added) {
          const contact = allContacts?.find((c) => c._id === contactId);
          if (contact) {
            await updateContact({
              id: contactId,
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
              role: contact.role,
              notes: contact.notes,
              venueIds: [...(contact.venueIds || []), venueId],
            });
          }
        }

        for (const contactId of removed) {
          const contact = allContacts?.find((c) => c._id === contactId);
          if (contact) {
            await updateContact({
              id: contactId,
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
              role: contact.role,
              notes: contact.notes,
              venueIds: (contact.venueIds || []).filter((id) => id !== venueId),
            });
          }
        }

        // Sync projects ↔ venue link
        const previousProjectIds = (linkedProjects || []).map((p) => p._id);
        const addedProjects = selectedProjectIds.filter(
          (id) => !previousProjectIds.includes(id),
        );
        const removedProjects = previousProjectIds.filter(
          (id) => !selectedProjectIds.includes(id),
        );

        for (const projectId of addedProjects) {
          const project = allProjects?.find((p) => p._id === projectId);
          if (project) {
            await updateProject({
              id: projectId,
              name: project.name,
              status: project.status,
              venueIds: [...(project.venueIds || []), venueId],
              startDate: project.startDate,
              endDate: project.endDate,
              description: project.description,
              notes: project.notes,
              budget: project.budget,
              profit: project.profit,
            });
          }
        }

        for (const projectId of removedProjects) {
          const project = allProjects?.find((p) => p._id === projectId);
          if (project) {
            await updateProject({
              id: projectId,
              name: project.name,
              status: project.status,
              venueIds: (project.venueIds || []).filter((id) => id !== venueId),
              startDate: project.startDate,
              endDate: project.endDate,
              description: project.description,
              notes: project.notes,
              budget: project.budget,
              profit: project.profit,
            });
          }
        }

        toast.success("Venue updated successfully");
      }
      onClose();
    } catch (error) {
      toast.error("Failed to save venue");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!venueId || isCreating) return;
    
    if (confirm("Are you sure you want to delete this venue?")) {
      try {
        await deleteVenue({ id: venueId });
        toast.success("Venue deleted successfully");
        onClose();
      } catch (error) {
        toast.error("Failed to delete venue");
      }
    }
  };

  const addLocation = () => {
    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, { city: "", state: "", country: "", phoneNumber: "" }]
    }));
  };

  const removeLocation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
  };

  const updateLocation = (index: number, field: keyof Location, value: string) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((loc, i) => 
        i === index ? { ...loc, [field]: value } : loc
      )
    }));
  };

  const contactsAnchor = useComboboxAnchor();
  const projectsAnchor = useComboboxAnchor();

  const handleAddNewContact = async () => {
    if (!newContact.name.trim()) {
      toast.error("Contact name is required");
      return;
    }

    try {
      const contactId = await createContact({
        name: newContact.name,
        email: newContact.email || undefined,
        phone: newContact.phone || undefined,
        role: newContact.role || undefined,
        venueIds: venueId ? [venueId] : [],
      });
      
      setSelectedContactIds((prev) => [...prev, contactId]);
      setNewContact({ name: "", email: "", phone: "", role: "" });
      setShowAddContact(false);
      toast.success("Contact added");
    } catch (error) {
      toast.error("Failed to add contact");
    }
  };

  const handleAddNewProject = async () => {
    if (!newProject.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      const projectId = await createProject({
        name: newProject.name,
        status: newProject.status,
        description: newProject.description || undefined,
        startDate: newProject.startDate || undefined,
        endDate: newProject.endDate || undefined,
        venueIds: venueId ? [venueId] : [],
      });

      setSelectedProjectIds((prev) => [...prev, projectId]);
      setNewProject({
        name: "",
        status: "Planning",
        description: "",
        startDate: "",
        endDate: "",
      });
      setShowAddProject(false);
      toast.success("Project added");
    } catch (error) {
      toast.error("Failed to add project");
    }
  };

  if (venue === undefined && !isCreating) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b bg-background">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {isCreating ? "New Venue" : "Edit Venue"}
          </h2>
          <div className="flex items-center gap-2">
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

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Venue Name *</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter venue name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as typeof prev.status }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="To Contact">To Contact</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Previous Client">Previous Client</SelectItem>
                    <SelectItem value="Ignore">Ignore</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as typeof prev.category }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Accessible">Accessible</SelectItem>
                    <SelectItem value="Ultimate Dream Goal">Ultimate Dream Goal</SelectItem>
                    <SelectItem value="Unconventional">Unconventional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Website URL</Label>
              <div className="flex">
                <Input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  className="rounded-r-none"
                  placeholder="https://example.com"
                />
                {formData.url ? (
                  <Button variant="outline" size="icon" className="rounded-l-none border-l-0" asChild>
                    <a href={formData.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" size="icon" className="rounded-l-none border-l-0" asChild>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(
                        [formData.name, ...formData.locations.map((l) => [l.city, l.state].filter(Boolean).join(", ")).filter(Boolean)].filter(Boolean).join(" ")
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Search Google for this venue"
                    >
                      <Search className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Submission Form URL</Label>
              <div className="flex">
                <Input
                  type="url"
                  value={formData.submissionFormUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, submissionFormUrl: e.target.value }))}
                  className="rounded-r-none"
                  placeholder="https://example.com/submit"
                />
                {formData.submissionFormUrl && (
                  <Button variant="outline" size="icon" className="rounded-l-none border-l-0" asChild>
                    <a href={formData.submissionFormUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Locations */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Locations</CardTitle>
            <Button variant="default" size="sm" onClick={addLocation}>
              <Plus className="h-3.5 w-3.5" />
              Add Location
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.locations.map((location, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Location {index + 1}</span>
                  {formData.locations.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeLocation(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="text"
                    value={location.city || ""}
                    onChange={(e) => updateLocation(index, "city", e.target.value)}
                    placeholder="City"
                  />
                  <Input
                    type="text"
                    value={location.state || ""}
                    onChange={(e) => updateLocation(index, "state", e.target.value)}
                    placeholder="State"
                  />
                  <Input
                    type="text"
                    value={location.country || ""}
                    onChange={(e) => updateLocation(index, "country", e.target.value)}
                    placeholder="Country"
                  />
                  <Input
                    type="tel"
                    value={location.phoneNumber || ""}
                    onChange={(e) => updateLocation(index, "phoneNumber", e.target.value)}
                    placeholder="Phone Number"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Contacts */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Contacts</CardTitle>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowAddContact(!showAddContact)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Contact
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new contact form */}
            {showAddContact && (
              <div className="p-4 bg-muted rounded-lg border space-y-3">
                <h4 className="text-sm font-medium">New Contact</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Name *"
                  />
                  <Input
                    type="text"
                    value={newContact.role}
                    onChange={(e) => setNewContact((p) => ({ ...p, role: e.target.value }))}
                    placeholder="Role"
                  />
                  <Input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))}
                    placeholder="Email"
                  />
                  <Input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Phone"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddContact(false);
                      setNewContact({ name: "", email: "", phone: "", role: "" });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddNewContact}>
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* Multi-select existing contacts */}
            <div className="space-y-2">
              <Label>Link existing contacts</Label>
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
                <ComboboxChips ref={contactsAnchor}>
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
                        <ComboboxChipsInput placeholder="Search contacts..." />
                      </>
                    )}
                  </ComboboxValue>
                </ComboboxChips>
                <ComboboxContent anchor={contactsAnchor}>
                  <ComboboxEmpty>No contacts found.</ComboboxEmpty>
                  <ComboboxList>
                    {(id: string) => {
                      const contact = allContacts?.find(
                        (c) => c._id === id,
                      );
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

        {/* Projects */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Projects</CardTitle>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowAddProject(!showAddProject)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Project
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new project form */}
            {showAddProject && (
              <div className="p-4 bg-muted rounded-lg border space-y-3">
                <h4 className="text-sm font-medium">New Project</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="text"
                    value={newProject.name}
                    onChange={(e) =>
                      setNewProject((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Project name *"
                  />
                  <Select
                    value={newProject.status}
                    onValueChange={(v) =>
                      setNewProject((p) => ({
                        ...p,
                        status: v as typeof p.status,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="text"
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Description"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={newProject.startDate}
                      onChange={(e) =>
                        setNewProject((p) => ({
                          ...p,
                          startDate: e.target.value,
                        }))
                      }
                      title="Start date"
                    />
                    <Input
                      type="date"
                      value={newProject.endDate}
                      onChange={(e) =>
                        setNewProject((p) => ({
                          ...p,
                          endDate: e.target.value,
                        }))
                      }
                      title="End date"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddProject(false);
                      setNewProject({
                        name: "",
                        status: "Planning",
                        description: "",
                        startDate: "",
                        endDate: "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddNewProject}>
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* Multi-select existing projects */}
            <div className="space-y-2">
              <Label>Link existing projects</Label>
              <Combobox
                multiple
                items={(allProjects ?? []).map((p) => p._id)}
                itemToStringValue={(id) => {
                  const p = allProjects?.find((p) => p._id === id);
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
                          const p = allProjects?.find((p) => p._id === id);
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
                      const project = allProjects?.find(
                        (p) => p._id === id,
                      );
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

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <MarkdownEditor
              content={formData.notes}
              onChange={(markdown) => setFormData(prev => ({ ...prev, notes: markdown }))}
              placeholder="Add your notes about this venue..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
