"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction } from "@/lib/actions/auth";

function CheckIcon({ met }: { met: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 transition-all duration-300 ease-out ${
        met
          ? "text-positive scale-100 opacity-100"
          : "text-muted-foreground/30 scale-75 opacity-60"
      }`}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={met ? 2.5 : 2}
      stroke="currentColor"
    >
      {met ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 12.75l6 6 9-13.5"
        />
      ) : (
        <circle cx="12" cy="12" r="4" strokeLinecap="round" />
      )}
    </svg>
  );
}

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signupAction, null);
  const [password, setPassword] = useState("");

  const checks = [
    { label: "Lowercase letter", met: /[a-z]/.test(password) },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Number", met: /[0-9]/.test(password) },
    {
      label: "Special character",
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|<>?,./`~]/.test(password),
    },
    { label: "8 characters minimum", met: password.length >= 8 },
  ];

  const showChecks = password.length > 0;

  if (state?.success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-positive/10">
          <svg
            className="h-6 w-6 text-positive"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          We sent you a confirmation link. Click it to activate your account.
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
    <form action={formAction} className="space-y-4">
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

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Create a password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div
          className={`grid transition-all duration-300 ease-out ${
            showChecks
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1.5 text-xs">
              {checks.map((c) => (
                <li
                  key={c.label}
                  className={`flex items-center gap-1.5 transition-colors duration-300 ${
                    c.met ? "text-foreground/70" : "text-muted-foreground/50"
                  }`}
                >
                  <CheckIcon met={c.met} />
                  {c.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground hover:text-positive transition-colors"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
