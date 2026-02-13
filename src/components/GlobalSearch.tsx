import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Building2,
  FolderKanban,
  Users,
  CheckSquare,
  Send,
  Search,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tab = "home" | "venues" | "projects" | "people" | "tasks" | "outreach";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToEntity: (tab: Tab, entityId: string) => void;
}

interface SearchResult {
  type: Tab;
  id: string;
  name: string;
  context?: string;
}

interface SearchGroup {
  label: string;
  icon: React.ReactNode;
  items: SearchResult[];
}

export function GlobalSearch({
  isOpen,
  onClose,
  onNavigateToEntity,
}: GlobalSearchProps) {
  const venues = useQuery(api.venues.list);
  const projects = useQuery(api.projects.list);
  const contacts = useQuery(api.contacts.list);
  const tasks = useQuery(api.tasks.list);
  const outreach = useQuery(api.outreach.list);

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      // Small delay to let dialog render
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const groups = useMemo((): SearchGroup[] => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    const maxPerType = 5;

    const venueResults: SearchResult[] = (venues ?? [])
      .filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          (v.notes || "").toLowerCase().includes(q),
      )
      .slice(0, maxPerType)
      .map((v) => ({
        type: "venues" as Tab,
        id: v._id,
        name: v.name,
        context: `${v.status} · ${v.category}`,
      }));

    const projectResults: SearchResult[] = (projects ?? [])
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q),
      )
      .slice(0, maxPerType)
      .map((p) => ({
        type: "projects" as Tab,
        id: p._id,
        name: p.name,
        context: p.status,
      }));

    const contactResults: SearchResult[] = (contacts ?? [])
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q) ||
          (c.role || "").toLowerCase().includes(q),
      )
      .slice(0, maxPerType)
      .map((c) => ({
        type: "people" as Tab,
        id: c._id,
        name: c.name,
        context: c.role || (c.types || []).join(", ") || undefined,
      }));

    const taskResults: SearchResult[] = (tasks ?? [])
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q),
      )
      .slice(0, maxPerType)
      .map((t) => ({
        type: "tasks" as Tab,
        id: t._id,
        name: t.title,
        context: `${t.status} · ${t.priority}`,
      }));

    const outreachResults: SearchResult[] = (outreach ?? [])
      .filter(
        (o) =>
          o.subject.toLowerCase().includes(q) ||
          (o.notes || "").toLowerCase().includes(q),
      )
      .slice(0, maxPerType)
      .map((o) => ({
        type: "outreach" as Tab,
        id: o._id,
        name: o.subject,
        context: `${o.date} · ${o.status}`,
      }));

    return [
      {
        label: "Venues",
        icon: <Building2 className="h-4 w-4" />,
        items: venueResults,
      },
      {
        label: "Projects",
        icon: <FolderKanban className="h-4 w-4" />,
        items: projectResults,
      },
      {
        label: "People",
        icon: <Users className="h-4 w-4" />,
        items: contactResults,
      },
      {
        label: "Tasks",
        icon: <CheckSquare className="h-4 w-4" />,
        items: taskResults,
      },
      {
        label: "Outreach",
        icon: <Send className="h-4 w-4" />,
        items: outreachResults,
      },
    ].filter((g) => g.items.length > 0);
  }, [query, venues, projects, contacts, tasks, outreach]);

  // Flatten results for keyboard navigation
  const flatResults = useMemo(
    () => groups.flatMap((g) => g.items),
    [groups],
  );

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [flatResults.length]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onNavigateToEntity(result.type, result.id);
      onClose();
      setQuery("");
    },
    [onNavigateToEntity, onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < flatResults.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : flatResults.length - 1,
        );
      } else if (e.key === "Enter" && flatResults[selectedIndex]) {
        e.preventDefault();
        handleSelect(flatResults[selectedIndex]);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [flatResults, selectedIndex, handleSelect, onClose],
  );

  // Scroll selected item into view
  useEffect(() => {
    const selected = resultsRef.current?.querySelector(
      `[data-index="${selectedIndex}"]`,
    );
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative mx-auto mt-[15vh] w-full max-w-xl">
        <div className="bg-background rounded-xl border shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search venues, projects, people, tasks, outreach..."
              className="flex-1 py-4 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results */}
          <div
            ref={resultsRef}
            className="max-h-[50vh] overflow-y-auto"
          >
            {query.length >= 2 && groups.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results found for &quot;{query}&quot;
              </div>
            )}

            {query.length < 2 && query.length > 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            )}

            {query.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Start typing to search across all your data
              </div>
            )}

            {groups.map((group) => (
              <div key={group.label}>
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2 bg-muted/30">
                  {group.icon}
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const currentIndex = flatIndex++;
                  const isSelected = currentIndex === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      data-index={currentIndex}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={cn(
                        "w-full text-left px-4 py-3 flex items-center gap-3 transition-colors",
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted",
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.name}
                        </p>
                        {item.context && (
                          <p className="text-xs text-muted-foreground truncate">
                            {item.context}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t bg-muted/30 flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">
                ↑↓
              </kbd>{" "}
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">
                ↵
              </kbd>{" "}
              Open
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">
                Esc
              </kbd>{" "}
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
