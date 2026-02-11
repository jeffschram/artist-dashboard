import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dashboard } from "./components/Dashboard";
import { ProjectsDashboard } from "./components/ProjectsDashboard";
import { PeopleDashboard } from "./components/PeopleDashboard";
import { PasswordForm } from "./components/PasswordForm";
import { LogOut, Building2, FolderKanban, Users } from "lucide-react";

type Tab = "venues" | "projects" | "people";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "venues", label: "Venues", icon: <Building2 className="h-4 w-4" /> },
  { key: "projects", label: "Projects", icon: <FolderKanban className="h-4 w-4" /> },
  { key: "people", label: "People", icon: <Users className="h-4 w-4" /> },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("venues");

  useEffect(() => {
    const authStatus = localStorage.getItem("artistDashboardAuth");
    setIsAuthenticated(authStatus === "true");
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("artistDashboardAuth");
    setIsAuthenticated(false);
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

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
    <div className="min-h-screen flex flex-col bg-muted/40">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="flex flex-col flex-1">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="h-16 flex justify-between items-center px-6">
            <h2 className="text-xl font-semibold">⚡️Artist Dashboard</h2>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
          <nav className="px-6 -mb-px">
            <TabsList className="bg-transparent h-auto p-0 gap-0">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 gap-2"
                >
                  {tab.icon}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </nav>
        </header>
        <main className="flex-1">
          <TabsContent value="venues" className="mt-0 h-full">
            <Dashboard />
          </TabsContent>
          <TabsContent value="projects" className="mt-0 h-full">
            <ProjectsDashboard />
          </TabsContent>
          <TabsContent value="people" className="mt-0 h-full">
            <PeopleDashboard />
          </TabsContent>
        </main>
      </Tabs>
      <Toaster />
    </div>
  );
}
