import { SignInWithPassword } from "./SignInWithPassword";
import { Toaster } from "./components/authUI/toaster";

export function SignInFormPassword() {
  return (
    <div className="max-w-[384px] mx-auto flex flex-col gap-4">
      <h2 className="font-semibold text-2xl tracking-tight">
        Sign in to your account
      </h2>
      <SignInWithPassword disableSignUp={true} />
      <Toaster />
    </div>
  );
}