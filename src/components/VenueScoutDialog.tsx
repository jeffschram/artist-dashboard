import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";

interface VenueScoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VenueScoutDialog({ open, onOpenChange }: VenueScoutDialogProps) {
  const [searchFocus, setSearchFocus] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const scoutVenues = useAction(api.venueScout.scout);

  const handleScout = async () => {
    setIsRunning(true);
    try {
      const result = await scoutVenues({
        searchFocus: searchFocus.trim() || undefined,
      });

      if (result.inserted > 0) {
        toast.success(`Found ${result.inserted} new venue${result.inserted !== 1 ? "s" : ""} for review!`, {
          description: `Searched ${result.searched} results, skipped ${result.skipped} duplicate${result.skipped !== 1 ? "s" : ""}`,
        });
      } else if (result.searched > 0) {
        toast.info("No new venues found this time", {
          description: `Searched ${result.searched} results — all were duplicates or didn't qualify`,
        });
      } else {
        toast.warning("Search returned no results", {
          description: "Try a different search focus or check your API keys",
        });
      }

      onOpenChange(false);
      setSearchFocus("");
    } catch (error) {
      console.error("Venue scout failed:", error);
      toast.error("Venue scout failed", {
        description: error instanceof Error ? error.message : "Check console for details",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Scout New Venues
          </DialogTitle>
          <DialogDescription>
            Search the web for new venue opportunities using AI. Found venues will appear in the "For Review" category.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="search-focus">Search Focus (optional)</Label>
            <Input
              id="search-focus"
              value={searchFocus}
              onChange={(e) => setSearchFocus(e.target.value)}
              placeholder="Leave blank for full scout, or enter e.g. 'Berlin' or 'light festivals'"
              disabled={isRunning}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isRunning) {
                  handleScout();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Blank runs a broad sweep across US cities. Enter text to narrow the search.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRunning}
          >
            Cancel
          </Button>
          <Button onClick={handleScout} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scouting...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Scout
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
