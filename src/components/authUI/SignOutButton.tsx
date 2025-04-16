import { useAuthActions } from "@convex-dev/auth/react";

interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className = "" }: SignOutButtonProps) {
  const { signOut } = useAuthActions();
  
  return (
    <button
      onClick={() => void signOut()}
      className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors ${className}`}
    >
      Sign out
    </button>
  );
} 