import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { Dashboard } from "./components/Dashboard";
import { ProjectsDashboard } from "./components/ProjectsDashboard";
import { ContactsDashboard } from "./components/ContactsDashboard";
import { PasswordForm } from "./components/PasswordForm";
import { LogOut, Building2, FolderKanban, Users } from "lucide-react";

type Tab = "venues" | "projects" | "contacts";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "venues", label: "Venues", icon: <Building2 size={16} /> },
  { key: "projects", label: "Projects", icon: <FolderKanban size={16} /> },
  { key: "contacts", label: "Contacts", icon: <Users size={16} /> },
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordForm onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="h-16 flex justify-between items-center px-6">
          <h2 className="text-xl font-semibold text-gray-900">⚡️Artist Dashboard</h2>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
        {/* Tab navigation */}
        <nav className="flex px-6 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="flex-1">
        {activeTab === "venues" && <Dashboard />}
        {activeTab === "projects" && <ProjectsDashboard />}
        {activeTab === "contacts" && <ContactsDashboard />}
      </main>
      <Toaster />
    </div>
  );
}
