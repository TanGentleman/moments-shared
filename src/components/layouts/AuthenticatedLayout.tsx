import React from "react";
import { SignOutButton } from "../authUI/SignOutButton";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="py-4 flex justify-end">
          <SignOutButton />
        </div>
        <main>{children}</main>
      </div>
    </div>
  );
} 