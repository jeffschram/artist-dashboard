import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Id } from "../../convex/_generated/dataModel";
import { ExternalLink, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix default marker icons (Leaflet + bundlers issue)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface VenueData {
  _id: Id<"venues">;
  name: string;
  url?: string;
  locations: { city?: string; state?: string; country?: string }[];
  status: string;
  category: string;
}

interface VenueMapProps {
  venues: VenueData[];
  onVenueSelect: (venueId: Id<"venues">) => void;
}

interface GeocodedVenue {
  venue: VenueData;
  lat: number;
  lng: number;
  locationLabel: string;
}

// Simple in-memory geocoding cache
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

async function geocodeLocation(query: string): Promise<{ lat: number; lng: number } | null> {
  if (geocodeCache.has(query)) return geocodeCache.get(query)!;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { "User-Agent": "ArtistDashboard/1.0" } },
    );
    const data = await res.json();
    if (data.length > 0) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache.set(query, result);
      return result;
    }
  } catch {
    // Nominatim failed, skip
  }
  geocodeCache.set(query, null);
  return null;
}

function buildLocationQuery(loc: { city?: string; state?: string; country?: string }): string {
  return [loc.city, loc.state, loc.country].filter(Boolean).join(", ");
}

/** Auto-fit the map to show all markers */
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 10);
    } else {
      const bounds = L.latLngBounds(positions.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, positions]);
  return null;
}

export function VenueMap({ venues, onVenueSelect }: VenueMapProps) {
  const [geocoded, setGeocoded] = useState<GeocodedVenue[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const abortRef = useRef(false);

  const geocodeAll = useCallback(async () => {
    abortRef.current = false;
    setIsGeocoding(true);

    // Collect venues that have at least one location with city/state/country
    const toGeocode: { venue: VenueData; query: string; label: string }[] = [];
    for (const venue of venues) {
      const loc = venue.locations.find(
        (l) => l.city || l.state || l.country,
      );
      if (loc) {
        const query = buildLocationQuery(loc);
        if (query) {
          toGeocode.push({ venue, query, label: query });
        }
      }
    }

    setProgress({ done: 0, total: toGeocode.length });
    const results: GeocodedVenue[] = [];

    for (let i = 0; i < toGeocode.length; i++) {
      if (abortRef.current) break;

      const { venue, query, label } = toGeocode[i];
      const coords = await geocodeLocation(query);
      if (coords) {
        results.push({ venue, lat: coords.lat, lng: coords.lng, locationLabel: label });
      }
      setProgress({ done: i + 1, total: toGeocode.length });

      // Update markers progressively
      setGeocoded([...results]);

      // Respect Nominatim rate limit (1 req/sec) — skip delay if cached
      if (!geocodeCache.has(query)) {
        await new Promise((r) => setTimeout(r, 1100));
      }
    }

    setIsGeocoding(false);
  }, [venues]);

  useEffect(() => {
    geocodeAll();
    return () => {
      abortRef.current = true;
    };
  }, [geocodeAll]);

  const positions: [number, number][] = geocoded.map((g) => [g.lat, g.lng]);

  // Default center: US center
  const defaultCenter: [number, number] = [39.8283, -98.5795];
  const defaultZoom = 4;

  const venuesWithoutLocation = venues.length - venues.filter(
    (v) => v.locations.some((l) => l.city || l.state || l.country),
  ).length;

  return (
    <div className="h-full flex flex-col">
      {/* Status bar */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-3 text-xs text-gray-500">
        <MapPin size={12} />
        <span>
          {geocoded.length} venue{geocoded.length !== 1 ? "s" : ""} mapped
        </span>
        {isGeocoding && (
          <span className="text-blue-600 animate-pulse">
            Geocoding... ({progress.done}/{progress.total})
          </span>
        )}
        {venuesWithoutLocation > 0 && !isGeocoding && (
          <span className="text-gray-400">
            {venuesWithoutLocation} venue{venuesWithoutLocation !== 1 ? "s" : ""} without location data
          </span>
        )}
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds positions={positions} />
          {geocoded.map((g) => (
            <Marker key={g.venue._id} position={[g.lat, g.lng]}>
              <Popup>
                <div className="min-w-[180px]">
                  <h4 className="font-semibold text-sm mb-1">{g.venue.name}</h4>
                  <p className="text-xs text-gray-500 mb-2">{g.locationLabel}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onVenueSelect(g.venue._id)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View details
                    </button>
                    {g.venue.url && (
                      <a
                        href={g.venue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
                      >
                        <ExternalLink size={10} />
                        website
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
