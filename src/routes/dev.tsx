import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInFormPassword } from "../CustomSignIn";
import { createFileRoute } from '@tanstack/react-router'
import { LoadingIndicator } from "../components";
import { AuthenticatedLayout } from "../components/layouts/AuthenticatedLayout";
import { DevContent } from "../components/DevContent";

function Dev() {
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
          <DevContent />
        </AuthenticatedLayout>
      </Authenticated>
    </>
  );
}

export const Route = createFileRoute('/dev')({
  component: Dev,
}); 