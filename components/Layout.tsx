import React, { useState } from "react";
import { NavLink, Outlet, useParams, useNavigate } from "react-router-dom";
import { db } from "../services/mockDb";
import { Icons, Button } from "./ui";
import SettingsDialog from "./SettingsDialog";

const Layout: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const user = db.getUser();
  const [showSettings, setShowSettings] = useState(false);

  // Determine if we are in a project context
  const isProjectView = !!projectId;

  const handleLogout = () => {
    db.logout();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-slate-900 text-slate-300 flex flex-col shrink-0 transition-all duration-300">
        <div
          className="p-6 border-b border-slate-800 flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/projects")}
        >
          <div className="h-8 w-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
            D
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            DataNexus
          </span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
          {!isProjectView && (
            <>
              <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Workspace
              </div>
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white"
                      : "hover:bg-slate-800/50"
                  }`
                }
              >
                <Icons.File /> <span>All Projects</span>
              </NavLink>
            </>
          )}

          {isProjectView && (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate("/projects")}
                className="w-full justify-start text-slate-400 hover:text-white mb-4 pl-0"
              >
                <span className="mr-2">←</span> Back to Projects
              </Button>

              <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Project Tools
              </div>

              <NavLink
                to={`/projects/${projectId}`}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-accent text-white shadow-lg shadow-blue-900/20"
                      : "hover:bg-slate-800"
                  }`
                }
              >
                <Icons.File /> <span>Transformation</span>
              </NavLink>

              <NavLink
                to={`/projects/${projectId}/chat`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-accent text-white shadow-lg shadow-blue-900/20"
                      : "hover:bg-slate-800"
                  }`
                }
              >
                <Icons.Message /> <span>Chat Assistant</span>
              </NavLink>

              <NavLink
                to={`/projects/${projectId}/dashboard`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-accent text-white shadow-lg shadow-blue-900/20"
                      : "hover:bg-slate-800"
                  }`
                }
              >
                <Icons.Chart /> <span>Smart Dashboard</span>
              </NavLink>
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-white text-xs h-8"
            onClick={() => setShowSettings(true)}
          >
            <svg
              className="mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Settings & Keys
          </Button>
          <div className="flex items-center gap-3">
            <img
              src={user.avatar}
              alt="User"
              className="h-9 w-9 rounded-full bg-slate-700"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <Button
            variant="destructive"
            className="w-full h-8 text-xs"
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>

      {showSettings && (
        <SettingsDialog onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default Layout;
