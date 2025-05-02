import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";

export function DevContent() {
  const userData = useQuery(api.customAuth.currentUser);
  const tags = useQuery(api.queries.listTags);
  const pendingApprovals = useQuery(api.queries.getPendingApprovals);
  const [userStats, setUserStats] = useState({
    accountAge: 0,
    loginCount: 0,
    lastActive: "",
  });
  
  useEffect(() => {
    if (userData) {
      // Calculate account age in days
      const accountAge = Math.floor((Date.now() - userData._creationTime) / (1000 * 60 * 60 * 24));
      
      // For demo purposes - these would normally come from your database
      const loginCount = Math.floor(Math.random() * 50) + 1;
      const lastActive = new Date().toLocaleString();
      
      setUserStats({
        accountAge,
        loginCount,
        lastActive,
      });
    }
  }, [userData]);
  
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-white">
      <h1 className="text-4xl font-bold mb-6">
        Welcome to Dev Mode! (This is only for authenticated users)
      </h1>
      {userData && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl">
          <h2 className="text-2xl font-semibold mb-4">User Information</h2>
          <div className="bg-gray-700 p-4 rounded overflow-auto mb-4">
            <div className="grid grid-cols-2 gap-2">
              <p className="text-lg">Email: <span className="font-medium">{userData.email}</span></p>
              <p className="text-lg">ID: <span className="font-medium">{userData._id}</span></p>
              <p className="text-lg">Account Age: <span className="font-medium">{userStats.accountAge} days</span></p>
              <p className="text-lg">Created: <span className="font-medium">{new Date(userData._creationTime).toLocaleString()}</span></p>
              <p className="text-lg">Login Count: <span className="font-medium">{userStats.loginCount}</span></p>
              <p className="text-lg">Last Active: <span className="font-medium">{userStats.lastActive}</span></p>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold mb-4">System Stats</h2>
          <div className="bg-gray-700 p-4 rounded overflow-auto">
            <div className="grid grid-cols-2 gap-2">
              <p className="text-lg">Available Tags: <span className="font-medium">{tags?.length || 0}</span></p>
              <p className="text-lg">Pending Approvals: <span className="font-medium">{pendingApprovals?.length || 0}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}