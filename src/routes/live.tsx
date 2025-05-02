import { createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"
import { SignInFormPassword } from "../CustomSignIn"
import { LoadingIndicator } from "../components"
import { AuthenticatedLayout } from "../components/layouts/AuthenticatedLayout"
import { LiveContent } from "../components/LiveContent"

function Live() {
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
          <LiveContent />
        </AuthenticatedLayout>
      </Authenticated>
    </>
  );
}

export const Route = createFileRoute('/live')({
  component: Live,
})