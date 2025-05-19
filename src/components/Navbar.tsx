import { Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Navbar() {
  // Get current user data to determine role
  const user = useQuery(api.customAuth.currentUser);
  // Helper to check for admin/owner role, always returns a boolean
  const isAdmin = !!user && (user.role === "admin" || user.role === "owner");
  
  return (
    <nav className="bg-gray-800 p-4 shadow">
      <div className="container mx-auto flex flex-wrap items-center justify-between">
        <div className="text-white font-bold text-xl tracking-tight">
          TanStack Chat
        </div>
        <div className="flex space-x-2 md:space-x-4 items-center">
          {/* Public */}
          <Link
            to="/"
            className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            activeProps={{
              className:
                "bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium",
            }}
          >
            Chat
          </Link>

          {/* Signed in only */}
          <Authenticated>
            <Link
              to="/live"
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              activeProps={{
                className:
                  "bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium",
              }}
            >
              Live
            </Link>
            <Link
              to="/dev"
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              activeProps={{
                className:
                  "bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium",
              }}
            >
              Dev
            </Link>
          </Authenticated>

          {/* Not signed in: show Sign In link to /dev */}
          <Unauthenticated>
            <Link
              to="/dev"
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              activeProps={{
                className:
                  "bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium",
              }}
            >
              Sign In
            </Link>
          </Unauthenticated>

          {/* Admin only */}
          {isAdmin && (
            <>
              <Link
                to="/approvals"
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                activeProps={{
                  className:
                    "bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium",
                }}
              >
                Approvals
              </Link>
              <Link
                to="/admin"
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                activeProps={{
                  className:
                    "bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium",
                }}
              >
                Admin
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}