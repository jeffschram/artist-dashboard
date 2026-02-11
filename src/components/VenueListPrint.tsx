import { useMemo } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { Printer, ExternalLink, MapPin, Mail, Users } from "lucide-react";

interface VenueData {
  _id: Id<"venues">;
  name: string;
  url?: string;
  submissionFormUrl?: string;
  locations: { city?: string; state?: string; country?: string; phoneNumber?: string }[];
  contacts: { name?: string; title?: string; email?: string; notes?: string }[];
  status: string;
  category: string;
  notes?: string;
  orderNum: number;
}

interface VenueListPrintProps {
  venues: VenueData[];
  onVenueSelect: (venueId: Id<"venues">) => void;
}

const CATEGORY_ORDER = ["Ultimate Dream Goal", "Accessible", "Unconventional"];

const CATEGORY_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  "Ultimate Dream Goal": { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
  "Accessible": { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  "Unconventional": { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
};

function getStatusBadge(status: string) {
  switch (status) {
    case "Contacted": return "bg-green-100 text-green-800";
    case "To Contact": return "bg-yellow-100 text-yellow-800";
    case "Ignore": return "bg-gray-100 text-gray-600";
    case "Previous Client": return "bg-teal-100 text-teal-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function formatLocation(loc: { city?: string; state?: string; country?: string }) {
  return [loc.city, loc.state, loc.country].filter(Boolean).join(", ");
}

export function VenueListPrint({ venues, onVenueSelect }: VenueListPrintProps) {
  const grouped = useMemo(() => {
    const groups: Record<string, VenueData[]> = {};
    for (const cat of CATEGORY_ORDER) {
      groups[cat] = [];
    }
    for (const venue of venues) {
      if (!groups[venue.category]) groups[venue.category] = [];
      groups[venue.category].push(venue);
    }
    // Sort venues by orderNum within each group
    for (const cat of Object.keys(groups)) {
      groups[cat].sort((a, b) => a.orderNum - b.orderNum);
    }
    return groups;
  }, [venues]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Print button — hidden when printing */}
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Printer size={16} />
          Print
        </button>
        <span className="text-xs text-gray-500">
          {venues.length} venue{venues.length !== 1 ? "s" : ""} across {CATEGORY_ORDER.length} categories
        </span>
      </div>

      {/* List content */}
      <div className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible">
        <div className="max-w-4xl mx-auto space-y-8 print:space-y-6 print:max-w-none">
          {/* Print header */}
          <div className="hidden print:block text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Venue List</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          {CATEGORY_ORDER.map((category) => {
            const venuesInCategory = grouped[category] || [];
            if (venuesInCategory.length === 0) return null;
            const style = CATEGORY_STYLE[category];

            return (
              <div key={category} className="print:break-inside-avoid-page">
                {/* Category header */}
                <div className={`px-4 py-2.5 rounded-lg ${style.bg} ${style.border} border mb-3 print:rounded-none print:border-x-0 print:border-t-0 print:border-b-2`}>
                  <h2 className={`text-lg font-bold ${style.text}`}>
                    {category}
                    <span className="ml-2 text-sm font-normal opacity-70">
                      ({venuesInCategory.length})
                    </span>
                  </h2>
                </div>
                <ul>
                  {/* Venue rows */}
                  <li className="space-y-2">
                    {venuesInCategory.map((venue) => {
                      const locations = venue.locations.filter(
                        (l) => l.city || l.state || l.country,
                      );
                      const contacts = venue.contacts.filter(
                        (c) => c.name || c.email,
                      );

                      return (
                        <div
                          key={venue._id}
                          className="bg-white border border-gray-200 rounded-lg p-4 print:rounded-none print:border-x-0 print:border-t-0 print:border-b print:px-2 print:py-3 print:break-inside-avoid cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all print:hover:border-gray-200 print:hover:shadow-none"
                          onClick={() => onVenueSelect(venue._id)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              {/* Name + status */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-gray-900">
                                  {venue.name}
                                </h3>
                                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getStatusBadge(venue.status)} print:border print:border-current`}>
                                  {venue.status}
                                </span>
                              </div>

                              {/* Location */}
                              {locations.length > 0 && (
                                <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                                  <MapPin size={12} className="shrink-0" />
                                  {locations.map((l, i) => (
                                    <span key={i}>
                                      {formatLocation(l)}
                                      {i < locations.length - 1 && " · "}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Contacts */}
                              {contacts.length > 0 && (
                                <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
                                  <Users size={12} className="shrink-0" />
                                  {contacts.map((c, i) => (
                                    <span key={i} className="flex items-center gap-1">
                                      {c.name}
                                      {c.email && (
                                        <span className="text-gray-400 flex items-center gap-0.5">
                                          <Mail size={10} />
                                          {c.email}
                                        </span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Notes preview */}
                              {venue.notes && (
                                <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 print:line-clamp-none">
                                  {venue.notes}
                                </p>
                              )}
                            </div>

                            {/* URL link */}
                            {venue.url && (
                              <a
                                href={venue.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="shrink-0 text-gray-400 hover:text-blue-600 transition-colors print:hidden"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>

                          {/* URL for print */}
                          {venue.url && (
                            <p className="hidden print:block text-xs text-gray-400 mt-1 break-all">
                              {venue.url}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </li>
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
