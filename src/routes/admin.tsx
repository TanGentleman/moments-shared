import { createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"
import { SignInFormPassword } from "../CustomSignIn"
import { LoadingIndicator } from "../components"
import { AuthenticatedLayout } from "../components/layouts/AuthenticatedLayout"
import { Button } from '../components/ui/button'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { UserRole } from "../../convex/admin"

function SeedContent() {
  const seedData = useMutation(api.populateTestData.populateApprovalData);
  const clearTables = useMutation(api.populateTestData.clearTables);
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <h1 className="text-3xl font-extrabold mb-4 text-white">Data Management</h1>
      <div className="flex flex-col md:flex-row md:space-x-8 space-y-4 md:space-y-0">
        <div className="flex-1 flex flex-col space-y-2">
          <Button 
            onClick={() => seedData()}
            className="w-fit"
          >
            Seed Test Data
          </Button>
          <Button 
            onClick={() => clearTables()}
            variant="destructive"
            className="w-fit"
          >
            Reset Tables (Destructive)
          </Button>
        </div>
        <div className="flex-1 flex items-center">
          <p className="text-sm text-muted-foreground mt-2 text-gray-300">
            <span className="font-semibold text-red-400">Warning:</span> The reset button will delete all data from the following tables: <span className="font-mono">tags</span>, <span className="font-mono">lifelogs</span>, <span className="font-mono">lifelogTags</span>, and <span className="font-mono">approvals</span>.
          </p>
        </div>
      </div>
    </div>
  )
}

function AdminPanel() {
  const users = useQuery(api.admin.listUsers) ?? [];
  const updateUserRole = useMutation(api.admin.updateUserRole);
  const deleteUser = useMutation(api.destructive.deleteUser);

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mt-8">
      <h2 className="text-2xl font-bold mb-2 text-white">Admin Panel</h2>
      <p className="text-gray-300 mb-4">Manage user roles below.</p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-gray-200">
          <thead>
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              // Ensure the role is always one of the allowed UserRole values (except UNAUTHENTICATED)
              // This helps with type safety and avoids the lint error.
              // We also normalize the value for the <select> to always be lowercase.
              // The updateUserRole mutation expects a role of type "admin" | "owner" | "friend" | "visitor"
              // so we cast the value accordingly.
              const allowedRoles = Object.values(UserRole).filter(
                r => r !== UserRole.UNAUTHENTICATED
              ) as Array<"visitor" | "friend" | "admin" | "owner">;

              // Normalize the user's current role to lowercase for the select value
              const currentRole =
                typeof user.role === "string"
                  ? user.role.toLowerCase()
                  : "";

              return (
                <tr key={user._id} className="border-t border-gray-700">
                  <td className="p-2">{user.email}</td>
                  <td className="p-2 capitalize">{user.role}</td>
                  <td className="p-2 flex gap-2 items-center">
                    <select
                      value={currentRole}
                      onChange={e =>
                        updateUserRole({
                          userId: user._id,
                          // Cast to the correct union type to satisfy TypeScript
                          role: e.target.value as "admin" | "owner" | "friend" | "visitor",
                        })
                      }
                      className="bg-gray-700 text-white rounded px-2 py-1"
                    >
                      {allowedRoles.map(role => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => deleteUser({ userId: user._id })}
                      className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Seed() {
  return (
    <>
      <AuthLoading>
        <LoadingIndicator />
      </AuthLoading>
      <Unauthenticated>
        <SignInFormPassword />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedLayout>
          <div className="max-w-3xl mx-auto py-8">
            <SeedContent />
            <AdminPanel />
          </div>
        </AuthenticatedLayout>
      </Authenticated>
    </>
  );
}

export const Route = createFileRoute('/admin')({
  component: Seed,
})