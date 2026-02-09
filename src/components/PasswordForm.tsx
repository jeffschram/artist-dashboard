import { useState } from "react";
import { Lock } from "lucide-react";

interface PasswordFormProps {
  onAuthenticated: () => void;
}

export function PasswordForm({ onAuthenticated }: PasswordFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simple password check - in a real app you'd want to hash this
    if (password === "Relentle55") {
      localStorage.setItem("artistDashboardAuth", "true");
      onAuthenticated();
    } else {
      setError("Incorrect password");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md mx-auto p-6">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Artist Dashboard</h1>
          <p className="text-gray-600">Enter password to access your venues</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow shadow-sm hover:shadow"
              placeholder="Enter password"
              required
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Checking..." : "Access Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
