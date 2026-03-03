"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile, useUpdateProfile } from "@/lib/api/hooks";
import { PlaidLinkButton } from "@/components/accounts/plaid-link-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function OnboardingWizard() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    if (!isLoading && profile) {
      if (!profile.display_name && !localStorage.getItem("charlie_onboarding_skipped")) {
        setOpen(true);
      }
    }
  }, [profile, isLoading]);

  if (!open) return null;

  const handleNext = () => {
    if (step === 1 && name.trim()) {
      updateProfile.mutate({ display_name: name.trim(), base_currency: currency } as any);
      setStep(2);
    } else {
        setStep(2);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("charlie_onboarding_skipped", "true");
    setOpen(false);
  };

  const handleFinish = () => {
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      {/* Hide close button intentionally */}
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden outline-none [&>button]:hidden">
        <DialogTitle className="sr-only">Welcome to Charlie</DialogTitle>
        <div className="flex h-1 bg-muted">
          <div
            className="bg-primary/50 transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>

        <div className="p-6 md:p-8">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  Welcome to Charlie 👋
                </h2>
                <p className="text-muted-foreground text-sm">
                  Let's get things set up. What should we call you?
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Preferred Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Alex"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Base Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                      <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD ($) - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">AUD ($) - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
                  Skip for now
                </Button>
                <Button onClick={handleNext} disabled={!name.trim() || updateProfile.isPending}>
                  {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  Connect your bank 🏦
                </h2>
                <p className="text-muted-foreground text-sm">
                  Charlie shines when it automatically pulls in your transactions and categorizes them for you. Let's securely connect your primary account.
                </p>
              </div>

              <div className="py-4 flex justify-center">
                <div className="w-full text-md py-6 rounded-xl shadow-lg border-2 border-primary/20 hover:border-primary/50 transition-all bg-card text-foreground flex justify-center items-center">
                  <PlaidLinkButton 
                    onSuccess={handleFinish} 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-muted-foreground">
                  Back
                </Button>
                <Button variant="ghost" size="sm" onClick={handleFinish}>
                  I'll do this later
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
