import { Link } from "@tanstack/react-router";

export function Navbar() {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex flex-wrap items-center justify-between">
        <div className="text-white font-bold text-xl">TanStack Chat</div>
        <div className="flex space-x-4">
          <Link
            to="/"
            className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            activeProps={{ className: "bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium" }}
          >
            Chat
          </Link>
          <Link
            to="/live"
            className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            activeProps={{ className: "bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium" }}
          >
            Live
          </Link>
          <Link
            to="/dev"
            className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            activeProps={{ className: "bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium" }}
          >
            Dev
          </Link>
          <Link
            to="/approvals"
            className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            activeProps={{ className: "bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium" }}
          >
            Approvals
          </Link>
        </div>
      </div>
    </nav>
  );
} 