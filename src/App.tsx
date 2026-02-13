import { useState, useEffect, useCallback } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Dashboard } from "./components/Dashboard";
import { ProjectsDashboard } from "./components/ProjectsDashboard";
import { PeopleDashboard } from "./components/PeopleDashboard";
import { TasksDashboard } from "./components/TasksDashboard";
import { OutreachDashboard } from "./components/OutreachDashboard";
import { HomeDashboard } from "./components/HomeDashboard";
import { GlobalSearch } from "./components/GlobalSearch";
import { PasswordForm } from "./components/PasswordForm";
import {
  LogOut,
  Building2,
  FolderKanban,
  Users,
  CheckSquare,
  Send,
  Home,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "home" | "venues" | "projects" | "people" | "tasks" | "outreach";

interface NavItem {
  key: Tab;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Home", icon: <Home className="h-5 w-5" /> },
  { key: "venues", label: "Venues", icon: <Building2 className="h-5 w-5" /> },
  { key: "projects", label: "Projects", icon: <FolderKanban className="h-5 w-5" /> },
  { key: "people", label: "People", icon: <Users className="h-5 w-5" /> },
  { key: "tasks", label: "Tasks", icon: <CheckSquare className="h-5 w-5" /> },
  { key: "outreach", label: "Outreach", icon: <Send className="h-5 w-5" /> },
];

type NavigationTarget = {
  tab: Tab;
  entityId: string;
} | null;

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [pendingNavigation, setPendingNavigation] =
    useState<NavigationTarget>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem("artistDashboardAuth");
    setIsAuthenticated(authStatus === "true");
    setIsLoading(false);
  }, []);

  // Cmd+K keyboard shortcut for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("artistDashboardAuth");
    setIsAuthenticated(false);
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleNavigateToEntity = useCallback(
    (tab: Tab, entityId: string) => {
      setPendingNavigation({ tab, entityId });
      setActiveTab(tab);
    },
    [],
  );

  const handleNavigationConsumed = useCallback(() => {
    setPendingNavigation(null);
  }, []);

  const handleSwitchTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordForm onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen flex bg-muted/40">
      {/* Sidebar */}
      <aside className="w-64 bg-background border-r flex flex-col fixed inset-y-0 left-0 z-20">
        {/* Logo/Title */}
        <div className="h-16 flex items-center px-6 border-b">
          <h2 className="text-lg font-semibold">⚡️Artist Dashboard</h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <button
                  onClick={() => setActiveTab(item.key)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    activeTab === item.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSearchOpen(true)}
            className="w-full justify-start gap-3 text-muted-foreground"
          >
            <Search className="h-5 w-5" />
            <span className="flex-1 text-left">Search</span>
            <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
              ⌘K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64">
        {activeTab === "home" && (
          <HomeDashboard
            onNavigateToEntity={handleNavigateToEntity}
            onSwitchTab={handleSwitchTab}
          />
        )}
        {activeTab === "venues" && (
          <Dashboard
            initialEntityId={
              pendingNavigation?.tab === "venues"
                ? pendingNavigation.entityId
                : undefined
            }
            onNavigationConsumed={handleNavigationConsumed}
          />
        )}
        {activeTab === "projects" && (
          <ProjectsDashboard
            initialEntityId={
              pendingNavigation?.tab === "projects"
                ? pendingNavigation.entityId
                : undefined
            }
            onNavigationConsumed={handleNavigationConsumed}
          />
        )}
        {activeTab === "people" && (
          <PeopleDashboard
            initialEntityId={
              pendingNavigation?.tab === "people"
                ? pendingNavigation.entityId
                : undefined
            }
            onNavigationConsumed={handleNavigationConsumed}
          />
        )}
        {activeTab === "tasks" && (
          <TasksDashboard
            initialEntityId={
              pendingNavigation?.tab === "tasks"
                ? pendingNavigation.entityId
                : undefined
            }
            onNavigationConsumed={handleNavigationConsumed}
          />
        )}
        {activeTab === "outreach" && (
          <OutreachDashboard
            initialEntityId={
              pendingNavigation?.tab === "outreach"
                ? pendingNavigation.entityId
                : undefined
            }
            onNavigationConsumed={handleNavigationConsumed}
          />
        )}
      </main>

      {/* Global Search */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigateToEntity={handleNavigateToEntity}
      />

      <Toaster />
    </div>
  );
}
