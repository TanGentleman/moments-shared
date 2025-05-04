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
  const clearTables = useMutation(api.populateTestData.clearTables);
  
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Data Management</h1>
      
      <div className="flex flex-col space-y-2">
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
        
        <p className="text-sm text-muted-foreground mt-2">
          Warning: The reset button will delete all data from the following tables: tags, lifelogs, lifelogTags, and approvals.
        </p>
      </div>
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