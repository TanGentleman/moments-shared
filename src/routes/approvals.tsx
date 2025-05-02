import { createFileRoute } from '@tanstack/react-router';
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInFormPassword } from "../CustomSignIn";
import { LoadingIndicator } from "../components";
import { AuthenticatedLayout } from "../components/layouts/AuthenticatedLayout";
import { ApprovalWorkflow } from '../components/ApprovalWorkflow';

function Approvals() {
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
          <ApprovalWorkflow />
        </AuthenticatedLayout>
      </Authenticated>
    </>
  );
}

export const Route = createFileRoute('/approvals')({
  component: Approvals,
}); 