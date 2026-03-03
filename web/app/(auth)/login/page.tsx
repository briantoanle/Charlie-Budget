"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/lib/actions/auth";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <form action={formAction} className="space-y-6 text-left">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Welcome back
        </p>
        <h2 className="text-3xl font-semibold leading-tight tracking-tight text-foreground">
          Sign in to Charlie
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Pick up where you left off and keep your money plan moving.
        </p>
      </header>

      <div className="space-y-3">
        <Label htmlFor="email" className="text-sm font-medium">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          autoFocus
          className="h-12 rounded-2xl border-foreground/15 bg-white/80 px-4"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          required
          autoComplete="current-password"
          className="h-12 rounded-2xl border-foreground/15 bg-white/80 px-4"
        />
      </div>

      {state?.error && (
        <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        className="h-12 w-full rounded-2xl bg-[linear-gradient(120deg,hsl(var(--foreground))_0%,hsl(var(--foreground)/0.86)_100%)] text-background hover:opacity-95"
        disabled={isPending}
      >
        {isPending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
