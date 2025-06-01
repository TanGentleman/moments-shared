import { createFileRoute } from '@tanstack/react-router'
import { SignInFormPassword } from "../CustomSignIn"
import { LoadingIndicator, AdminContent } from "../components"
import { AuthenticatedLayout } from "../components/layouts/AuthenticatedLayout"
import { useCurrentUser } from "../useCurrentUser"

function Admin() {
  const { isLoading, isAuthenticated } = useCurrentUser();
  
  return (
    <>
      {isLoading ? (
        <LoadingIndicator />
      ) : isAuthenticated ? (
        <AuthenticatedLayout>
          <AdminContent />
        </AuthenticatedLayout>
      ) : (
        <SignInFormPassword />
      )}
    </>
  );
}

export const Route = createFileRoute('/admin')({
  component: Admin,
})