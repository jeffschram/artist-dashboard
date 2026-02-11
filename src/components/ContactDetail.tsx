import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { X, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MarkdownEditor } from "./MarkdownEditor";

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {isCreating ? "New Contact" : "Edit Contact"}
          </h2>
          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete contact"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {isSaving ? "Saving..." : "Save"}
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
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Details</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((p) => ({ ...p, name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contact name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, email: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, phone: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(555) 555-5555"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) =>
                setFormData((p) => ({ ...p, role: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Booking Agent, Manager"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Venues (optional)
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
              {(venues ?? []).map((v) => (
                <label
                  key={v._id}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.venueIds.includes(v._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData((p) => ({
                          ...p,
                          venueIds: [...p.venueIds, v._id],
                        }));
                      } else {
                        setFormData((p) => ({
                          ...p,
                          venueIds: p.venueIds.filter((id) => id !== v._id),
                        }));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">{v.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
          <MarkdownEditor
            content={formData.notes}
            onChange={(markdown) =>
              setFormData((p) => ({ ...p, notes: markdown }))
            }
            placeholder="Add notes about this contact..."
          />
        </div>
      </div>
    </div>
  );
}
