import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { X, Plus, Trash2, Save, ExternalLink } from "lucide-react";
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

interface Contact {
  name?: string;
  title?: string;
  email?: string;
  notes?: string;
}

export function VenueDetail({ venueId, isCreating, onClose }: VenueDetailProps) {
  const venue = useQuery(api.venues.get, venueId ? { id: venueId } : "skip");
  const createVenue = useMutation(api.venues.create);
  const updateVenue = useMutation(api.venues.update);
  const deleteVenue = useMutation(api.venues.remove);

  const [formData, setFormData] = useState({
    name: "",
    url: "",
    submissionFormUrl: "",
    locations: [{ city: "", state: "", country: "", phoneNumber: "" }] as Location[],
    contacts: [{ name: "", title: "", email: "", notes: "" }] as Contact[],
    status: "To Contact" as "Contacted" | "To Contact" | "Ignore" | "Previous Client",
    category: "Accessible" as "Ultimate Dream Goal" | "Accessible" | "Unconventional",
    notes: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (venue && !isCreating) {
      setFormData({
        name: venue.name,
        url: venue.url || "",
        submissionFormUrl: venue.submissionFormUrl || "",
        locations: venue.locations.length > 0 ? venue.locations : [{ city: "", state: "", country: "", phoneNumber: "" }],
        contacts: venue.contacts.length > 0 ? venue.contacts : [{ name: "", title: "", email: "", notes: "" }],
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
        contacts: [{ name: "", title: "", email: "", notes: "" }],
        status: "To Contact",
        category: "Accessible",
        notes: "",
      });
    }
  }, [venue, isCreating]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Venue name is required");
      return;
    }

    setIsSaving(true);
    try {
      if (isCreating) {
        await createVenue(formData);
        toast.success("Venue created successfully");
      } else if (venueId) {
        await updateVenue({ id: venueId, ...formData });
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

  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      contacts: [...prev.contacts, { name: "", title: "", email: "", notes: "" }]
    }));
  };

  const removeContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
  };

  const updateContact = (index: number, field: keyof Contact, value: string) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
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
                {formData.url && (
                  <a
                    href={formData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink size={16} />
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
              onClick={addContact}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} />
              Add Contact
            </button>
          </div>

          <div className="space-y-4">
            {formData.contacts.map((contact, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Contact {index + 1}</span>
                  {formData.contacts.length > 1 && (
                    <button
                      onClick={() => removeContact(index)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    value={contact.name || ""}
                    onChange={(e) => updateContact(index, "name", e.target.value)}
                    placeholder="Name"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={contact.title || ""}
                    onChange={(e) => updateContact(index, "title", e.target.value)}
                    placeholder="Title"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <input
                  type="email"
                  value={contact.email || ""}
                  onChange={(e) => updateContact(index, "email", e.target.value)}
                  placeholder="Email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                />
                <textarea
                  value={contact.notes || ""}
                  onChange={(e) => updateContact(index, "notes", e.target.value)}
                  placeholder="Notes about this contact"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ))}
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
