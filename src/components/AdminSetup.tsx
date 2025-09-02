import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function AdminSetup() {
  const [userId, setUserId] = useState("");
  const setUserAsAdmin = useMutation(api.userProfile.setUserAsAdmin);
  const userProfile = useQuery(api.userProfile.getUserProfile);
  
  const handleSetAdmin = async () => {
    try {
      await setUserAsAdmin({ userId });
      toast.success("User has been set as admin successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to set user as admin");
    }
  };

  const handleSetSelfAsAdmin = async () => {
    try {
      // This is a special case for initial setup
      // We'll directly update the database to set the current user as admin
      await setUserAsAdmin({ userId: userProfile?.userId });
      toast.success("You are now an admin!");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "Failed to set yourself as admin");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Setup</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Make Yourself Admin</h2>
        <p className="text-gray-600 mb-4">
          If you're setting up this application for the first time, you need to make yourself an admin.
        </p>
        
        <button
          onClick={handleSetSelfAsAdmin}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Make Me Admin
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Set Another User as Admin</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            User ID
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter user ID"
          />
        </div>
        
        <button
          onClick={handleSetAdmin}
          disabled={!userId}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Set as Admin
        </button>
      </div>
    </div>
  );
}