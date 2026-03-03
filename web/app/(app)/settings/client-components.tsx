"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DisconnectDialog } from "@/components/accounts/disconnect-dialog";
import {
  useSuspenseProfile,
  useUpdateProfile,
  useUpdateCurrency,
  useAccounts,
  useSyncPlaidItem,
  useDeleteAccount,
  useDeleteUserAccount,
  useExportData,
} from "@/lib/api/hooks";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Globe,
  Landmark,
  ChevronDown,
  ChevronRight,
  Download,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Check,
  Loader2,
  MapPin,
} from "lucide-react";
import {
  StaggerList,
  StaggerItem,
} from "@/components/ui/motion-primitives";

export function SettingsClientComponents() {
  return (
    <StaggerList className="space-y-6">
      <StaggerItem><ProfileSection /></StaggerItem>
      <StaggerItem><CurrencySection /></StaggerItem>
      <StaggerItem><CountrySection /></StaggerItem>
      <StaggerItem><ConnectedAccountsSection /></StaggerItem>
      <StaggerItem><ExportSection /></StaggerItem>
      <StaggerItem><DangerZone /></StaggerItem>
    </StaggerList>
  );
}

const CURRENCIES = [
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "CHF", label: "Swiss Franc" },
  { code: "CNY", label: "Chinese Yuan" },
  { code: "INR", label: "Indian Rupee" },
  { code: "MXN", label: "Mexican Peso" },
  { code: "BRL", label: "Brazilian Real" },
  { code: "SGD", label: "Singapore Dollar" },
  { code: "HKD", label: "Hong Kong Dollar" },
  { code: "KRW", label: "South Korean Won" },
  { code: "SEK", label: "Swedish Krona" },
  { code: "VND", label: "Vietnamese Dong" },
];

/* ────────────────────────────────────────────────────────────────── */
/*  1. Profile                                                        */
/* ────────────────────────────────────────────────────────────────── */

function ProfileSection() {
  const { data: profile } = useSuspenseProfile();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);

  const handleEdit = () => {
    setName(profile?.display_name ?? "");
    setEditing(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    updateProfile.mutate(
      { display_name: name.trim() },
      { onSuccess: () => setEditing(false) }
    );
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Profile</h2>
          <p className="text-xs text-muted-foreground">
            Your display name and account info
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Display Name</Label>
          {editing ? (
            <div className="mt-1 flex items-center gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 max-w-[260px]"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
              <Button
                size="sm"
                className="h-8"
                onClick={handleSave}
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-medium">
                {profile?.display_name || "Not set"}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={handleEdit}
              >
                Edit
              </Button>
            </div>
          )}
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Account ID</Label>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {profile?.id || "Not available"}
          </p>
        </div>
      </div>

      {updateProfile.error && (
        <p className="mt-2 text-xs text-destructive">
          {updateProfile.error.message}
        </p>
      )}

      <div className="mt-4 rounded-md bg-positive/5 border border-positive/20 p-3 flex items-start gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-positive mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <strong>Tip:</strong> Set your country below to get accurate holiday spending predictions on your dashboard.
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  2. Base Currency                                                  */
/* ────────────────────────────────────────────────────────────────── */

function CurrencySection() {
  const { data: profile } = useSuspenseProfile();
  const updateCurrency = useUpdateCurrency();
  const [selected, setSelected] = useState("");
  const [confirming, setConfirming] = useState(false);

  const handleSelect = (val: string) => {
    setSelected(val);
    if (val !== profile?.base_currency) {
      setConfirming(true);
    }
  };

  const handleConfirm = () => {
    updateCurrency.mutate(
      { currency: selected },
      {
        onSuccess: () => {
          setConfirming(false);
          setSelected("");
        },
      }
    );
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <Globe className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Base Currency</h2>
          <p className="text-xs text-muted-foreground">
            All amounts are converted to this currency for reports
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={selected || profile?.base_currency || "USD"}
          onValueChange={handleSelect}
          disabled={updateCurrency.isPending}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.code} — {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {confirming && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={updateCurrency.isPending}
            >
              {updateCurrency.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Recalculating…
                </>
              ) : (
                "Confirm Change"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setConfirming(false);
                setSelected("");
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {updateCurrency.isPending && (
        <p className="mt-2 text-xs text-muted-foreground">
          Recalculating all transaction amounts… This may take a moment.
        </p>
      )}

      {updateCurrency.error && (
        <p className="mt-2 text-xs text-destructive">
          {updateCurrency.error.message}
        </p>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  3. Country                                                        */
/* ────────────────────────────────────────────────────────────────── */

function CountrySection() {
  const { data: profile } = useSuspenseProfile();
  const updateProfile = useUpdateProfile();

  const handleSelect = (val: string) => {
    updateProfile.mutate({ country: val });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Location</h2>
          <p className="text-xs text-muted-foreground">
            Used for regional features like holiday predictions
          </p>
        </div>
      </div>

      <Select
        value={profile?.country || "US"}
        onValueChange={handleSelect}
        disabled={updateProfile.isPending}
      >
        <SelectTrigger className="w-[240px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="US">🇺🇸 United States</SelectItem>
          <SelectItem value="CA">🇨🇦 Canada</SelectItem>
        </SelectContent>
      </Select>

      {updateProfile.error && (
        <p className="mt-2 text-xs text-destructive">
          {updateProfile.error.message}
        </p>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  4. Connected Accounts                                             */
/* ────────────────────────────────────────────────────────────────── */

function ConnectedAccountsSection() {
  const { data: accounts, isLoading } = useAccounts();
  const syncPlaid = useSyncPlaidItem();
  const deleteAccount = useDeleteAccount();
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const [disconnectingItem, setDisconnectingItem] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const plaidAccounts =
    accounts?.filter((a) => a.source === "plaid" && a.plaid_item_id) ?? [];

  // Group by plaid_item_id
  const items = new Map<
    string,
    {
      plaid_item_id: string;
      institution_name: string;
      needs_reauth: boolean;
      last_synced_at: string | null;
      accounts: typeof plaidAccounts;
    }
  >();

  for (const acct of plaidAccounts) {
    const pid = acct.plaid_item_id!;
    if (!items.has(pid)) {
      items.set(pid, {
        plaid_item_id: pid,
        institution_name: acct.institution_name ?? "Unknown",
        needs_reauth: acct.needs_reauth,
        last_synced_at: acct.last_synced_at,
        accounts: [],
      });
    }
    items.get(pid)!.accounts.push(acct);
  }

  if (isLoading) return <Skeleton className="h-28 rounded-lg" />;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <Landmark className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Connected Accounts</h2>
          <p className="text-xs text-muted-foreground">
            Bank connections via Plaid
          </p>
        </div>
      </div>

      {items.size === 0 ? (
        <p className="text-sm text-muted-foreground">
          No bank accounts connected.
        </p>
      ) : (
        <div className="space-y-3">
          {Array.from(items.values()).map((item) => (
            <div
              key={item.plaid_item_id}
              className="rounded-md border border-border p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="flex min-w-0 items-center gap-2 text-left"
                  onClick={() =>
                    setExpandedItemId((prev) =>
                      prev === item.plaid_item_id ? null : item.plaid_item_id
                    )
                  }
                >
                  {expandedItemId === item.plaid_item_id ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">
                    {item.institution_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({item.accounts.length} account{item.accounts.length === 1 ? "" : "s"})
                  </span>
                  {item.needs_reauth && (
                    <Badge
                      variant="destructive"
                      className="text-[10px] px-1.5 py-0"
                    >
                      Re-auth needed
                    </Badge>
                  )}
                </button>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() =>
                      syncPlaid.mutate({
                        plaid_item_id: item.plaid_item_id,
                      })
                    }
                    disabled={syncPlaid.isPending}
                  >
                    <RefreshCw
                      className={`mr-1 h-3 w-3 ${syncPlaid.isPending ? "animate-spin" : ""}`}
                    />
                    Sync
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => setDisconnectingItem({ id: item.plaid_item_id, name: item.institution_name })}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>

              {expandedItemId === item.plaid_item_id && (
                <ul className="space-y-1 pl-6">
                  {item.accounts.map((account) => (
                    <li
                      key={account.id}
                      className="text-xs text-muted-foreground"
                    >
                      {account.name}
                    </li>
                  ))}
                </ul>
              )}

              {item.last_synced_at && (
                <p className="text-[10px] text-muted-foreground">
                  Last synced:{" "}
                  {new Date(item.last_synced_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {(syncPlaid.error || deleteAccount.error) && (
        <p className="mt-2 text-xs text-destructive">
          {syncPlaid.error?.message || deleteAccount.error?.message}
        </p>
      )}

      {disconnectingItem && (
        <DisconnectDialog
          open={!!disconnectingItem}
          onOpenChange={(open) => !open && setDisconnectingItem(null)}
          plaidItemId={disconnectingItem.id}
          institutionName={disconnectingItem.name}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  4. Export                                                         */
/* ────────────────────────────────────────────────────────────────── */

function ExportSection() {
  const exportData = useExportData();
  const [format, setFormat] = useState<"csv" | "json">("csv");

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <Download className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Export Data</h2>
          <p className="text-xs text-muted-foreground">
            Download your data as CSV or JSON
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={format}
          onValueChange={(v) => setFormat(v as "csv" | "json")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="csv">CSV (Transactions)</SelectItem>
            <SelectItem value="json">JSON (Full Export)</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={() => exportData.mutate(format)}
          disabled={exportData.isPending}
        >
          {exportData.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Exporting…
            </>
          ) : (
            <>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download
            </>
          )}
        </Button>
      </div>

      {exportData.error && (
        <p className="mt-2 text-xs text-destructive">
          {exportData.error.message}
        </p>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  5. Danger Zone                                                    */
/* ────────────────────────────────────────────────────────────────── */

function DangerZone() {
  const router = useRouter();
  const deleteUser = useDeleteUserAccount();
  const [confirmText, setConfirmText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    deleteUser.mutate(undefined, {
      onSuccess: () => {
        router.push("/login");
      },
    });
  };

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-destructive">
            Danger Zone
          </h2>
          <p className="text-xs text-muted-foreground">
            Permanently delete your account and all data
          </p>
        </div>
      </div>

      {!showConfirm ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowConfirm(true)}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Delete Account
        </Button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This action is <strong className="text-foreground">irreversible</strong>.
            All your accounts, transactions, budgets, and categories will be
            permanently deleted. Type{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
              DELETE
            </code>{" "}
            to confirm.
          </p>
          <div className="flex items-center gap-2">
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="h-8 w-[140px] font-mono uppercase"
              autoFocus
            />
            <Button
              variant="destructive"
              size="sm"
              disabled={confirmText !== "DELETE" || deleteUser.isPending}
              onClick={handleDelete}
            >
              {deleteUser.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Confirm Delete"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowConfirm(false);
                setConfirmText("");
              }}
            >
              Cancel
            </Button>
          </div>

          {deleteUser.error && (
            <p className="text-xs text-destructive">
              {deleteUser.error.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
