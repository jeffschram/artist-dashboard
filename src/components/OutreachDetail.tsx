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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OutreachDetailProps {
  outreachId: Id<"outreach"> | null;
  isCreating: boolean;
  onClose: () => void;
  initialVenueId?: Id<"venues">;
  initialContactId?: Id<"contacts">;
  initialProjectId?: Id<"projects">;
}

type OutreachMethod =
  | "Email"
  | "Phone"
  | "In Person"
  | "Submission Form"
  | "Social Media"
  | "Other";
type OutreachDirection = "Outbound" | "Inbound";
type OutreachStatus =
  | "To Do"
  | "Sent"
  | "Awaiting Response"
  | "Responded"
  | "Follow Up Needed"
  | "No Response"
  | "Declined"
  | "Accepted";

const NONE_VALUE = "__none__";

export function OutreachDetail({
  outreachId,
  isCreating,
  onClose,
  initialVenueId,
  initialContactId,
  initialProjectId,
}: OutreachDetailProps) {
  const entry = useQuery(
    api.outreach.get,
    outreachId ? { id: outreachId } : "skip",
  );
  const venues = useQuery(api.venues.list);
  const contacts = useQuery(api.contacts.list);
  const projects = useQuery(api.projects.list);

  const createOutreach = useMutation(api.outreach.create);
  const updateOutreach = useMutation(api.outreach.update);
  const deleteOutreach = useMutation(api.outreach.remove);

  const [formData, setFormData] = useState({
    subject: "",
    method: "Email" as OutreachMethod,
    direction: "Outbound" as OutreachDirection,
    date: new Date().toISOString().slice(0, 10),
    status: "To Do" as OutreachStatus,
    followUpDate: "",
    notes: "",
    venueId: "" as string,
    contactId: "" as string,
    projectId: "" as string,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (entry && !isCreating) {
      setFormData({
        subject: entry.subject,
        method: entry.method,
        direction: entry.direction,
        date: entry.date,
        status: entry.status,
        followUpDate: entry.followUpDate || "",
        notes: entry.notes || "",
        venueId: entry.venueId || "",
        contactId: entry.contactId || "",
        projectId: entry.projectId || "",
      });
    } else if (isCreating) {
      setFormData({
        subject: "",
        method: "Email",
        direction: "Outbound",
        date: new Date().toISOString().slice(0, 10),
        status: "Sent",
        followUpDate: "",
        notes: "",
        venueId: initialVenueId || "",
        contactId: initialContactId || "",
        projectId: initialProjectId || "",
      });
    }
  }, [entry, isCreating, initialVenueId, initialContactId, initialProjectId]);

  const handleSave = async () => {
    if (!formData.subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        subject: formData.subject,
        method: formData.method,
        direction: formData.direction,
        date: formData.date,
        status: formData.status,
        followUpDate: formData.followUpDate || undefined,
        notes: formData.notes || undefined,
        venueId: formData.venueId
          ? (formData.venueId as Id<"venues">)
          : undefined,
        contactId: formData.contactId
          ? (formData.contactId as Id<"contacts">)
          : undefined,
        projectId: formData.projectId
          ? (formData.projectId as Id<"projects">)
          : undefined,
      };

      if (isCreating) {
        await createOutreach(payload);
        toast.success("Outreach logged");
      } else if (outreachId) {
        await updateOutreach({ id: outreachId, ...payload });
        toast.success("Outreach updated");
      }
      onClose();
    } catch {
      toast.error("Failed to save outreach");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!outreachId || isCreating) return;
    if (confirm("Are you sure you want to delete this outreach entry?")) {
      try {
        await deleteOutreach({ id: outreachId });
        toast.success("Outreach deleted");
        onClose();
      } catch {
        toast.error("Failed to delete outreach");
      }
    }
  };

  if (!isCreating && entry === undefined) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const allVenues = venues ?? [];
  const allContacts = contacts ?? [];
  const allProjects = projects ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-xl font-semibold">
          {isCreating ? "Log Outreach" : "Edit Outreach"}
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
        {/* Outreach Details */}
        <Card>
          <CardHeader>
            <CardTitle>Outreach Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                type="text"
                value={formData.subject}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, subject: e.target.value }))
                }
                placeholder="e.g., Portfolio submission, Follow-up email"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Method</Label>
                <Select
                  value={formData.method}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, method: v as OutreachMethod }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Phone">Phone</SelectItem>
                    <SelectItem value="In Person">In Person</SelectItem>
                    <SelectItem value="Submission Form">
                      Submission Form
                    </SelectItem>
                    <SelectItem value="Social Media">Social Media</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Direction</Label>
                <Select
                  value={formData.direction}
                  onValueChange={(v) =>
                    setFormData((p) => ({
                      ...p,
                      direction: v as OutreachDirection,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Outbound">Outbound</SelectItem>
                    <SelectItem value="Inbound">Inbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, date: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData((p) => ({
                      ...p,
                      status: v as OutreachStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="To Do">To Do</SelectItem>
                    <SelectItem value="Sent">Sent</SelectItem>
                    <SelectItem value="Awaiting Response">
                      Awaiting Response
                    </SelectItem>
                    <SelectItem value="Responded">Responded</SelectItem>
                    <SelectItem value="Follow Up Needed">
                      Follow Up Needed
                    </SelectItem>
                    <SelectItem value="No Response">No Response</SelectItem>
                    <SelectItem value="Declined">Declined</SelectItem>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Follow-Up Date</Label>
              <Input
                type="date"
                value={formData.followUpDate}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, followUpDate: e.target.value }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Related Entities */}
        <Card>
          <CardHeader>
            <CardTitle>Related To</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Venue</Label>
              <Select
                value={formData.venueId || NONE_VALUE}
                onValueChange={(v) =>
                  setFormData((p) => ({
                    ...p,
                    venueId: v === NONE_VALUE ? "" : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a venue (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {allVenues.map((venue) => (
                    <SelectItem key={venue._id} value={venue._id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Person</Label>
              <Select
                value={formData.contactId || NONE_VALUE}
                onValueChange={(v) =>
                  setFormData((p) => ({
                    ...p,
                    contactId: v === NONE_VALUE ? "" : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a person (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {allContacts.map((contact) => (
                    <SelectItem key={contact._id} value={contact._id}>
                      {contact.name}
                      {contact.role ? ` — ${contact.role}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                value={formData.projectId || NONE_VALUE}
                onValueChange={(v) =>
                  setFormData((p) => ({
                    ...p,
                    projectId: v === NONE_VALUE ? "" : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {allProjects.map((project) => (
                    <SelectItem key={project._id} value={project._id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              placeholder="Add notes about this outreach..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
