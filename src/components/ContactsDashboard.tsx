import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { SlideOver } from "./SlideOver";
import { ContactDetail } from "./ContactDetail";
import { Plus, Search, Mail, Phone, Building2, UserCircle } from "lucide-react";

type Mode = "idle" | "editing" | "creating";

export function ContactsDashboard() {
  const contacts = useQuery(api.contacts.list);
  const venues = useQuery(api.venues.list);
  const [selectedContactId, setSelectedContactId] =
    useState<Id<"contacts"> | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [searchQuery, setSearchQuery] = useState("");

  if (contacts === undefined || venues === undefined) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const venueMap = new Map(venues.map((v) => [v._id, v.name]));

  const filtered = contacts.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const venueName = c.venueId ? venueMap.get(c.venueId) || "" : "";
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.role || "").toLowerCase().includes(q) ||
      venueName.toLowerCase().includes(q)
    );
  });

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

  return (
    <div className="h-[calc(100vh-7rem)]">
      {/* Toolbar */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <span className="text-sm text-gray-500">
          {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
        </span>

        <button
          onClick={handleCreate}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          New Contact
        </button>
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg font-medium">No contacts found</p>
            <p className="text-sm mt-1">
              {contacts.length === 0
                ? 'Add your first contact by clicking "New Contact"'
                : "Try adjusting your search"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((contact) => {
              const venueName = contact.venueId
                ? venueMap.get(contact.venueId)
                : null;
              return (
                <button
                  key={contact._id}
                  onClick={() => handleSelect(contact._id)}
                  className="text-left bg-white p-5 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <UserCircle size={22} className="text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {contact.name}
                      </h3>
                      {contact.role && (
                        <p className="text-sm text-gray-500 truncate">
                          {contact.role}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    {contact.email && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Mail size={13} className="shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Phone size={13} className="shrink-0" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                    {venueName && (
                      <div className="flex items-center gap-2 text-gray-400 pt-1 border-t border-gray-100 mt-2">
                        <Building2 size={13} className="shrink-0" />
                        <span className="truncate">{venueName}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-over */}
      <SlideOver isOpen={mode !== "idle"} onClose={handleClose}>
        <ContactDetail
          contactId={selectedContactId}
          isCreating={mode === "creating"}
          onClose={handleClose}
        />
      </SlideOver>
    </div>
  );
}
