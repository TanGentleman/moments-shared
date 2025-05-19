import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "./components/authUI/button";
import { Input } from "./components/authUI/input";
import { useToast } from "./components/authUI/use-toast";
import { useState } from "react";
import { ConvexError } from "convex/values";
import { INVALID_PASSWORD } from "../convex/errors";

// TODO: Use Tanstack Form
// https://tanstack.com/form/latest/docs/framework/react/guides/validation
export function SignInWithPassword({
  provider,
  handleSent,
  handlePasswordReset,
  customSignUp,
  passwordRequirements,
  disableSignUp = true,
}: {
  provider?: string;
  handleSent?: (email: string) => void;
  handlePasswordReset?: () => void;
  customSignUp?: React.ReactNode;
  passwordRequirements?: string;
  disableSignUp?: boolean;
}) {
  const { signIn } = useAuthActions();
  const { toast } = useToast();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(event.currentTarget);
    if (disableSignUp) {
      formData.set("flow", "signIn");
    }
    
    try {
      await signIn(provider ?? "password", formData);
      handleSent?.(formData.get("email") as string);
    } catch (error) {
      console.error(error);
      
      let toastTitle: string;
      if (error instanceof ConvexError && error.data === INVALID_PASSWORD) {
        toastTitle = "Invalid password - check the requirements and try again.";
      } else {
        toastTitle = flow === "signIn"
          ? "Could not sign in, please check your credentials."
          : "Could not sign up, did you mean to sign in?";
      }
      
      toast({ title: toastTitle, variant: "destructive" });
      setSubmitting(false);
    }
  };
  
  const toggleFlow = () => {
    setFlow(flow === "signIn" ? "signUp" : "signIn");
  };

  return (
    <form className="flex flex-col" onSubmit={handleSubmit}>
      {/* Under the hood, treated as an email. Displayed as username. */}
      <label htmlFor="email">Username</label>
      <Input name="email" id="email" className="mb-4" autoComplete="email" />
      
      {/* Add role as a hidden input */}
      <input name="role" value="visitor" type="hidden" />
      
      <div className="flex items-center justify-between">
        <label htmlFor="password">Password</label>
        {handlePasswordReset && flow === "signIn" && (
          <Button
            className="p-0 h-auto"
            type="button"
            variant="link"
            onClick={handlePasswordReset}
          >
            Forgot your password?
          </Button>
        )}
      </div>
      
      <Input
        type="password"
        name="password"
        id="password"
        autoComplete={flow === "signIn" ? "current-password" : "new-password"}
      />
      
      {flow === "signUp" && passwordRequirements !== null && (
        <span className="text-gray-500 font-thin text-sm">
          {passwordRequirements}
        </span>
      )}
      
      {flow === "signUp" && customSignUp}
      <input name="flow" value={flow} type="hidden" />
      
      <Button type="submit" disabled={submitting} className="mt-4">
        {flow === "signIn" ? "Sign in" : "Sign up"}
      </Button>
      
      {!disableSignUp && (
        <Button
          variant="link"
          type="button"
          onClick={toggleFlow}
        >
          {flow === "signIn"
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </Button>
      )}
    </form>
  );
}