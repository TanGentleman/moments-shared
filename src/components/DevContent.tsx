import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function DevContent() {
  const user = useQuery(api.customAuth.currentUser)?.email ?? "Unknown";
  
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-white">
      <h1 className="text-4xl font-bold mb-6">
        Welcome to Dev Mode! (This is only for authenticated users)
      </h1>
      {user && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">User Information</h2>
          <div className="bg-gray-700 p-4 rounded overflow-auto max-w-2xl">
            <p className="text-lg">Name: <span className="font-medium">{user}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}