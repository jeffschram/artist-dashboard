import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  AlertTriangle,
  Mail,
  Building2,
  FolderKanban,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tab = "home" | "venues" | "projects" | "people" | "tasks" | "outreach";

interface HomeDashboardProps {
  onNavigateToEntity: (tab: Tab, entityId: string) => void;
  onSwitchTab: (tab: Tab) => void;
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    // Venues
    "To Contact": "bg-yellow-100 text-yellow-800",
    Contacted: "bg-green-100 text-green-800",
    Ignore: "bg-gray-100 text-gray-600",
    "Previous Client": "bg-teal-100 text-teal-800",
    // Projects
    Planning: "bg-blue-100 text-blue-800",
    "In Progress": "bg-yellow-100 text-yellow-800",
    Completed: "bg-green-100 text-green-800",
    Cancelled: "bg-gray-100 text-gray-600",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function HomeDashboard({
  onNavigateToEntity,
  onSwitchTab,
}: HomeDashboardProps) {
  const actionItems = useQuery(api.dashboard.getActionItems);
  const pipeline = useQuery(api.dashboard.getPipelineSummary);
  const recentActivity = useQuery(api.dashboard.getRecentActivity);
  const venues = useQuery(api.venues.list);
  const contacts = useQuery(api.contacts.list);

  const venueMap = useMemo(() => {
    if (!venues) return new Map();
    return new Map(venues.map((v) => [v._id, v.name]));
  }, [venues]);

  const contactMap = useMemo(() => {
    if (!contacts) return new Map();
    return new Map(contacts.map((c) => [c._id, c.name]));
  }, [contacts]);

  // Merge recent activity into a single sorted timeline
  const timeline = useMemo(() => {
    if (!recentActivity) return [];
    const items = [
      ...recentActivity.recentVenues,
      ...recentActivity.recentProjects,
      ...recentActivity.recentContacts,
    ];
    return items
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 10);
  }, [recentActivity]);

  if (!actionItems || !pipeline || !recentActivity) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalActionItems = actionItems.venuesNeedingOutreach.length;

  return (
    <div className="h-screen overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSwitchTab("venues")}
            >
              <Plus className="h-4 w-4" />
              Add Venue
            </Button>
          </div>
        </div>

        {/* Action Items */}
        {totalActionItems > 0 && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertTriangle className="h-5 w-5" />
                Needs Attention ({totalActionItems})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Venues needing outreach */}
              {actionItems.venuesNeedingOutreach.slice(0, 5).map((venue) => (
                <button
                  key={venue._id}
                  onClick={() => onNavigateToEntity("venues", venue._id)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-lg bg-white border hover:border-primary/30 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                      {venue.name}
                    </p>
                    <p className="text-xs text-blue-600">
                      No outreach yet — ready to contact
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="border-0 text-xs shrink-0 bg-purple-100 text-purple-800"
                  >
                    {venue.category}
                  </Badge>
                </button>
              ))}
              {actionItems.venuesNeedingOutreach.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{actionItems.venuesNeedingOutreach.length - 5} more venues to contact
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {totalActionItems === 0 && (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="py-6">
              <p className="text-center text-green-800 font-medium">
                All caught up! No action items right now.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Pipeline Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Venues */}
          <Card
            className="cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => onSwitchTab("venues")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Venues
                <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-3">
                {pipeline.venues.total}
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(pipeline.venues.byStatus).map(
                  ([status, count]) => (
                    <Badge
                      key={status}
                      variant="secondary"
                      className={cn(
                        "text-xs border-0",
                        getStatusColor(status),
                      )}
                    >
                      {status}: {count}
                    </Badge>
                  ),
                )}
              </div>
            </CardContent>
          </Card>

          {/* Projects */}
          <Card
            className="cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => onSwitchTab("projects")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FolderKanban className="h-4 w-4" />
                Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-3">
                {pipeline.projects.total}
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(pipeline.projects.byStatus).map(
                  ([status, count]) => (
                    <Badge
                      key={status}
                      variant="secondary"
                      className={cn(
                        "text-xs border-0",
                        getStatusColor(status),
                      )}
                    >
                      {status}: {count}
                    </Badge>
                  ),
                )}
              </div>
            </CardContent>
          </Card>

          {/* People */}
          <Card
            className="cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => onSwitchTab("people")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="h-4 w-4" />
                People
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-3">
                {pipeline.contacts.total}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity yet. Start by adding venues and logging
                outreach!
              </p>
            ) : (
              <div className="space-y-2">
                {timeline.map((item) => {
                  const icon =
                    item.type === "venue" ? (
                      <Building2 className="h-4 w-4 text-purple-500" />
                    ) : item.type === "project" ? (
                      <FolderKanban className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Mail className="h-4 w-4 text-green-500" />
                    );

                  const tab: Tab =
                    item.type === "venue"
                      ? "venues"
                      : item.type === "project"
                        ? "projects"
                        : "people";

                  const label =
                    item.type === "venue"
                      ? "Venue added"
                      : item.type === "project"
                        ? "Project added"
                        : "Person added";

                  return (
                    <button
                      key={`${item.type}-${item._id}`}
                      onClick={() => onNavigateToEntity(tab, item._id)}
                      className="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {label}
                          {"status" in item && item.status
                            ? ` · ${item.status}`
                            : ""}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(item._creationTime).toLocaleDateString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
