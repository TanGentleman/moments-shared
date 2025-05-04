import { createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"
import { SignInFormPassword } from "../CustomSignIn"
import { LoadingIndicator } from "../components"
import { AuthenticatedLayout } from "../components/layouts/AuthenticatedLayout"
import { Button } from '../components/ui/button'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

function SeedContent() {
  const seedData = useMutation(api.populateTestData.populateApprovalData);
  return (
    <div>
      Hello "/seed"!
      <Button onClick={() => {
        seedData();
      }}>Seed Data</Button>
    </div>
  )
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
          <SeedContent />
        </AuthenticatedLayout>
      </Authenticated>
    </>
  );
}

export const Route = createFileRoute('/seed')({
  component: Seed,
})