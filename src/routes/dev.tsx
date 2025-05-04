import { createFileRoute } from '@tanstack/react-router'
import { LoadingIndicator } from "../components";
import { AuthenticatedLayout } from "../components/layouts/AuthenticatedLayout";
import { DevContent } from "../components/DevContent";
import { SignInFormPassword } from "../CustomSignIn";
import { useCurrentUser } from "../useCurrentUser";

function Dev() {
  const { isLoading, isAuthenticated } = useCurrentUser();
  
  return (
    <>
      {isLoading ? (
        <LoadingIndicator />
      ) : isAuthenticated ? (
        <AuthenticatedLayout>
          <DevContent />
        </AuthenticatedLayout>
      ) : (
        <SignInFormPassword />
      )}
    </>
  );
}

export const Route = createFileRoute('/dev')({
  component: Dev,
}); 