import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignIn } from "../SignIn";
import { SignOut } from "../SignOut";
import { createFileRoute } from '@tanstack/react-router'

function Dev() {
return (
    <>
        <AuthLoading>{/* consider showing a loading indicator */}</AuthLoading>
        <Unauthenticated>
        <SignIn />
        </Unauthenticated>
        <Authenticated>
        <SignOut />
        <Content />
        </Authenticated>
    </>
    );
}

// NOTE: Double check the syntax here!
function Content() {
  /* render signed-in content */
  return (
    <html>
      <head>
        {/* Add your head content here */}
      </head>
      <body className="bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <h1 className="text-4xl font-bold text-white">
            Welcome to Dev Mode! (This is is only for authenticated users)
          </h1>
        </div>
      </body>
    </html>
  )
}
export const Route = createFileRoute('/dev')({
  component: Dev,
}) 