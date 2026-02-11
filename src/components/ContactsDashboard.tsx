import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { SlideOver } from "./SlideOver";
import { ContactDetail } from "./ContactDetail";
import { Plus, Search, Mail, Phone, Building2, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const venueMap = new Map(venues.map((v) => [v._id, v.name]));

  const filtered = contacts.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const venueNames = (c.venueIds || []).map((id) => venueMap.get(id) || "").join(" ");
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.role || "").toLowerCase().includes(q) ||
      venueNames.toLowerCase().includes(q)
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
      <div className="px-6 py-4 bg-background border-b flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="pl-9"
          />
        </div>

        <span className="text-sm text-muted-foreground">
          {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
        </span>

        <Button onClick={handleCreate} size="sm" className="ml-auto">
          <Plus className="h-4 w-4" />
          New Contact
        </Button>
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
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
              const venueNames = (contact.venueIds || [])
                .map((id) => venueMap.get(id))
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
