"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    null
  );

  if (state?.success) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-semibold">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          If an account exists for that email, we sent a password reset link.
        </p>
        <Link href="/login">
          <Button variant="outline" className="mt-2">
            Back to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 text-left">
      <p className="text-sm text-muted-foreground">
        Enter your email and we will send reset instructions.
      </p>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          autoFocus
        />
      </div>

      {state?.error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}

      <Button type="submit" className="h-10 w-full rounded-xl" disabled={isPending}>
        {isPending ? "Sending…" : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-foreground hover:text-positive transition-colors"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
