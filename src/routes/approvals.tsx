import { createFileRoute } from '@tanstack/react-router';
import { ApprovalWorkflow } from '../components/ApprovalWorkflow';

export const Route = createFileRoute('/approvals')({
  component: ApprovalWorkflow,
}); 