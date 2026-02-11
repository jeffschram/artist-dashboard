import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { X, Plus, Trash2, Save, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";
import { MarkdownEditor } from "./MarkdownEditor";

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
  const createVenue = useMutation(api.venues.create);
  const updateVenue = useMutation(api.venues.update);
  const deleteVenue = useMutation(api.venues.remove);
  const createContact = useMutation(api.contacts.create);
  const updateContact = useMutation(api.contacts.update);

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
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
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

  // Sync selected contacts from linked contacts
  useEffect(() => {
    if (linkedContacts) {
      setSelectedContactIds(linkedContacts.map((c) => c._id));
    }
  }, [linkedContacts]);

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
          contacts: [], // No inline contacts for new venues
          contactIds: selectedContactIds,
        });
        
        // Update all selected contacts to include this new venue
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
        toast.success("Venue created successfully");
      } else if (venueId) {
        // Update venue with new contactIds
        await updateVenue({
          id: venueId,
          ...formData,
          contacts: venue?.contacts || [], // Preserve legacy inline contacts
          contactIds: selectedContactIds,
        });

        // Update contacts: add/remove this venue from their venueIds
        const previousContactIds = (linkedContacts || []).map((c) => c._id);
        const added = selectedContactIds.filter((id) => !previousContactIds.includes(id));
        const removed = previousContactIds.filter((id) => !selectedContactIds.includes(id));

        // Add this venue to newly linked contacts
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

        // Remove this venue from unlinked contacts
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

  const toggleContactSelection = (contactId: Id<"contacts">) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

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

  if (venue === undefined && !isCreating) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {isCreating ? "New Venue" : "Edit Venue"}
          </h2>
          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete venue"
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

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venue Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter venue name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="To Contact">To Contact</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Previous Client">Previous Client</option>
                  <option value="Ignore">Ignore</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Accessible">Accessible</option>
                  <option value="Ultimate Dream Goal">Ultimate Dream Goal</option>
                  <option value="Unconventional">Unconventional</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website URL
              </label>
              <div className="flex">
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com"
                />
                {formData.url ? (
                  <a
                    href={formData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink size={16} />
                  </a>
                ) : (
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(
                      [formData.name, ...formData.locations.map((l) => [l.city, l.state].filter(Boolean).join(", ")).filter(Boolean)].filter(Boolean).join(" ")
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 transition-colors text-sm text-gray-600"
                    title="Search Google for this venue"
                  >
                    <Search size={14} />
                  </a>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Submission Form URL
              </label>
              <div className="flex">
                <input
                  type="url"
                  value={formData.submissionFormUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, submissionFormUrl: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/submit"
                />
                {formData.submissionFormUrl && (
                  <a
                    href={formData.submissionFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Locations */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Locations</h3>
            <button
              onClick={addLocation}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} />
              Add Location
            </button>
          </div>

          <div className="space-y-4">
            {formData.locations.map((location, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Location {index + 1}</span>
                  {formData.locations.length > 1 && (
                    <button
                      onClick={() => removeLocation(index)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={location.city || ""}
                    onChange={(e) => updateLocation(index, "city", e.target.value)}
                    placeholder="City"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={location.state || ""}
                    onChange={(e) => updateLocation(index, "state", e.target.value)}
                    placeholder="State"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={location.country || ""}
                    onChange={(e) => updateLocation(index, "country", e.target.value)}
                    placeholder="Country"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="tel"
                    value={location.phoneNumber || ""}
                    onChange={(e) => updateLocation(index, "phoneNumber", e.target.value)}
                    placeholder="Phone Number"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contacts */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Contacts</h3>
            <button
              onClick={() => setShowAddContact(!showAddContact)}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} />
              Add Contact
            </button>
          </div>

          {/* Add new contact form */}
          {showAddContact && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <h4 className="text-sm font-medium text-gray-700">New Contact</h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Name *"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <input
                  type="text"
                  value={newContact.role}
                  onChange={(e) => setNewContact((p) => ({ ...p, role: e.target.value }))}
                  placeholder="Role"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Email"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="Phone"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowAddContact(false);
                    setNewContact({ name: "", email: "", phone: "", role: "" });
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNewContact}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Multi-select existing contacts */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Link existing contacts ({selectedContactIds.length} selected)
            </label>
            <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
              {allContacts && allContacts.length > 0 ? (
                allContacts.map((contact) => (
                  <label
                    key={contact._id}
                    className="flex items-start gap-2 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedContactIds.includes(contact._id)}
                      onChange={() => toggleContactSelection(contact._id)}
                      className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {contact.name}
                      </div>
                      {contact.role && (
                        <div className="text-xs text-gray-500">{contact.role}</div>
                      )}
                      {contact.email && (
                        <div className="text-xs text-gray-500 truncate">{contact.email}</div>
                      )}
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500 p-2">
                  No contacts available. Create one using the button above.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
          <MarkdownEditor
            content={formData.notes}
            onChange={(markdown) => setFormData(prev => ({ ...prev, notes: markdown }))}
            placeholder="Add your notes about this venue..."
          />
        </div>
      </div>
    </div>
  );
}
