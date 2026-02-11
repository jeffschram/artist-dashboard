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

interface ContactDetailProps {
  contactId: Id<"contacts"> | null;
  isCreating: boolean;
  /** Pre-fill venue when creating from a venue view */
  defaultVenueId?: Id<"venues">;
  onClose: () => void;
}

export function ContactDetail({
  contactId,
  isCreating,
  defaultVenueId,
  onClose,
}: ContactDetailProps) {
  const contact = useQuery(
    api.contacts.get,
    contactId ? { id: contactId } : "skip",
  );
  const venues = useQuery(api.venues.list);
  const createContact = useMutation(api.contacts.create);
  const updateContact = useMutation(api.contacts.update);
  const deleteContact = useMutation(api.contacts.remove);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    notes: "",
    venueIds: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);
  const venuesAnchor = useComboboxAnchor();

  useEffect(() => {
    if (contact && !isCreating) {
      setFormData({
        name: contact.name,
        email: contact.email || "",
        phone: contact.phone || "",
        role: contact.role || "",
        notes: contact.notes || "",
        venueIds: contact.venueIds || [],
      });
    } else if (isCreating) {
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "",
        notes: "",
        venueIds: defaultVenueId ? [defaultVenueId] : [],
      });
    }
  }, [contact, isCreating, defaultVenueId]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Contact name is required");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        role: formData.role || undefined,
        notes: formData.notes || undefined,
        venueIds: formData.venueIds as Id<"venues">[],
      };

      if (isCreating) {
        await createContact(payload);
        toast.success("Contact created");
      } else if (contactId) {
        await updateContact({ id: contactId, ...payload });
        toast.success("Contact updated");
      }
      onClose();
    } catch {
      toast.error("Failed to save contact");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!contactId || isCreating) return;
    if (confirm("Are you sure you want to delete this contact?")) {
      try {
        await deleteContact({ id: contactId });
        toast.success("Contact deleted");
        onClose();
      } catch {
        toast.error("Failed to delete contact");
      }
    }
  };

  if (contact === undefined && !isCreating) {
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
            {isCreating ? "New Contact" : "Edit Contact"}
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

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Contact name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="(555) 555-5555"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                type="text"
                value={formData.role}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, role: e.target.value }))
                }
                placeholder="e.g. Booking Agent, Manager"
              />
            </div>

            <div className="space-y-2">
              <Label>Venues (optional)</Label>
              <Combobox
                multiple
                items={(venues ?? []).map((v) => v._id)}
                itemToStringValue={(id) => {
                  const v = (venues ?? []).find((v) => v._id === id);
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
                          const v = (venues ?? []).find((v) => v._id === id);
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
                      const v = (venues ?? []).find((v) => v._id === id);
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
              placeholder="Add notes about this contact..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
