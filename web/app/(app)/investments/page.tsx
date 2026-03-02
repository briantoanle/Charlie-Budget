"use client";

import { useState, useMemo } from "react";
import {
  useInvestmentAccounts,
  useHoldings,
  useTrades,
  useCreateTrade,
  useDividends,
  useCreateDividend,
  type HoldingResponse,
  type TradeResponse,
  type DividendResponse,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Calculator,
  BarChart3,
  History,
  DollarSign,
  Loader2,
} from "lucide-react";
import {
  PageTransition,
  FadeIn,
  StaggerList,
  StaggerItem,
  AnimatedNumber,
  SlideIn,
  motion,
  AnimatePresence,
} from "@/components/ui/motion-primitives";

/* ────────────────────────────────────────────────────────────────── */
/*  Page                                                              */
/* ────────────────────────────────────────────────────────────────── */

export default function InvestmentsPage() {
  const { data: accounts, isLoading: accountsLoading } =
    useInvestmentAccounts();

  return (
    <PageTransition>
      <div className="space-y-6">
        <FadeIn>
          <h1 className="text-2xl font-semibold tracking-tight">
            Investments
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your portfolio holdings, trades, and dividends
          </p>
        </FadeIn>

        {accountsLoading ? (
          <Skeleton className="h-64 rounded-lg skeleton-shimmer" />
        ) : !accounts || accounts.length === 0 ? (
          <FadeIn delay={0.15}>
            <EmptyPortfolio />
          </FadeIn>
        ) : (
          <FadeIn delay={0.1}>
            <Tabs defaultValue="holdings" className="space-y-4">
              <TabsList className="grid w-full max-w-md grid-cols-4">
                <TabsTrigger value="holdings" className="gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Holdings
                </TabsTrigger>
                <TabsTrigger value="trades" className="gap-1.5">
                  <History className="h-3.5 w-3.5" />
                  Trades
                </TabsTrigger>
                <TabsTrigger value="dividends" className="gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  Dividends
                </TabsTrigger>
                <TabsTrigger value="drip" className="gap-1.5">
                  <Calculator className="h-3.5 w-3.5" />
                  DRIP
                </TabsTrigger>
              </TabsList>

              <TabsContent value="holdings">
                <HoldingsTab />
              </TabsContent>
              <TabsContent value="trades">
                <TradesTab accounts={accounts} />
              </TabsContent>
              <TabsContent value="dividends">
                <DividendsTab accounts={accounts} />
              </TabsContent>
              <TabsContent value="drip">
                <DripCalculator />
              </TabsContent>
            </Tabs>
          </FadeIn>
        )}
      </div>
    </PageTransition>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Empty state                                                       */
/* ────────────────────────────────────────────────────────────────── */

function EmptyPortfolio() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
        <BarChart3 className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-sm font-semibold">No investment accounts</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Create an investment account to start tracking your portfolio.
        Investment accounts are separate from bank accounts.
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        (Investment account creation is coming soon.)
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Helpers                                                           */
/* ────────────────────────────────────────────────────────────────── */

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtCurrency(n: number) {
  return `$${fmt(n)}`;
}

function PnlBadge({ value, pct }: { value: number; pct: number }) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono text-xs ${
        positive ? "text-positive glow-positive" : "text-destructive glow-destructive"
      }`}
    >
      {positive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {fmtCurrency(Math.abs(value))} ({fmt(Math.abs(pct), 1)}%)
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  1. Holdings Tab                                                   */
/* ────────────────────────────────────────────────────────────────── */

function HoldingsTab() {
  const { data: holdings, isLoading } = useHoldings();

  if (isLoading) return <Skeleton className="h-48 rounded-lg skeleton-shimmer" />;

  const data = holdings ?? [];

  const totalMarketValue = data.reduce((s, h) => s + h.market_value, 0);
  const totalCostBasis = data.reduce((s, h) => s + h.quantity * h.avg_cost, 0);
  const totalPnl = totalMarketValue - totalCostBasis;
  const totalPnlPct =
    totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0;

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No holdings yet. Log a trade to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <StaggerList className="grid grid-cols-3 gap-4">
        <StaggerItem>
          <div className="card-hover rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Market Value</p>
            <AnimatedNumber
              value={totalMarketValue}
              format="currency"
              className="mt-1 block text-xl font-semibold font-mono"
            />
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="card-hover rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Cost Basis</p>
            <AnimatedNumber
              value={totalCostBasis}
              format="currency"
              className="mt-1 block text-xl font-semibold font-mono"
            />
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="card-hover rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Unrealized P&L</p>
            <div className="mt-1 flex items-center gap-2">
              {totalPnl >= 0 ? (
                <TrendingUp className="h-4 w-4 text-positive" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <PnlBadge value={totalPnl} pct={totalPnlPct} />
            </div>
          </div>
        </StaggerItem>
      </StaggerList>

      {/* Holdings table */}
      <FadeIn delay={0.2}>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Avg Cost</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Market Value</TableHead>
                <TableHead className="text-right">P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((h: HoldingResponse, i: number) => (
                <motion.tr
                  key={h.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.04, duration: 0.3 }}
                  className="border-b border-border transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-mono font-medium">
                    {h.ticker}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {fmt(h.quantity, 4)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {fmtCurrency(h.avg_cost)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {fmtCurrency(h.current_price)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {fmtCurrency(h.market_value)}
                  </TableCell>
                  <TableCell className="text-right">
                    <PnlBadge value={h.unrealized_pnl} pct={h.unrealized_pnl_pct} />
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </FadeIn>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  2. Trades Tab                                                     */
/* ────────────────────────────────────────────────────────────────── */

interface AccountItem {
  id: string;
  name: string;
  broker: string | null;
  currency: string;
}

function TradesTab({ accounts }: { accounts: AccountItem[] }) {
  const { data: trades, isLoading } = useTrades();
  const createTrade = useCreateTrade();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    account_id: accounts[0]?.id ?? "",
    ticker: "",
    side: "buy" as "buy" | "sell",
    quantity: "",
    price: "",
    trade_date: new Date().toISOString().slice(0, 10),
  });

  const handleSubmit = () => {
    if (!form.ticker || !form.quantity || !form.price) return;
    createTrade.mutate(
      {
        account_id: form.account_id,
        ticker: form.ticker,
        side: form.side,
        quantity: parseFloat(form.quantity),
        price: parseFloat(form.price),
        trade_date: form.trade_date,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm((f) => ({ ...f, ticker: "", quantity: "", price: "" }));
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Trade History</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Log Trade
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <SlideIn direction="down">
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <Label className="text-xs">Account</Label>
                  <Select
                    value={form.account_id}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, account_id: v }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Ticker</Label>
                  <Input
                    className="mt-1 uppercase font-mono"
                    placeholder="AAPL"
                    value={form.ticker}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, ticker: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Side</Label>
                  <Select
                    value={form.side}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, side: v as "buy" | "sell" }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    className="mt-1 font-mono"
                    type="number"
                    step="any"
                    placeholder="100"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, quantity: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Price</Label>
                  <Input
                    className="mt-1 font-mono"
                    type="number"
                    step="any"
                    placeholder="150.00"
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input
                    className="mt-1 font-mono"
                    type="date"
                    value={form.trade_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, trade_date: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={createTrade.isPending}
                >
                  {createTrade.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Submit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                {form.quantity && form.price && (
                  <span className="ml-auto text-xs text-muted-foreground font-mono">
                    Total:{" "}
                    {fmtCurrency(
                      parseFloat(form.quantity) * parseFloat(form.price)
                    )}
                  </span>
                )}
              </div>
              {createTrade.error && (
                <p className="text-xs text-destructive">
                  {createTrade.error.message}
                </p>
              )}
            </div>
          </SlideIn>
        )}
      </AnimatePresence>

      {isLoading ? (
        <Skeleton className="h-36 rounded-lg skeleton-shimmer" />
      ) : (trades ?? []).length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No trades recorded yet.
          </p>
        </div>
      ) : (
        <FadeIn delay={0.1}>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(trades ?? []).map((t: TradeResponse, i: number) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.25 }}
                    className="border-b border-border transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-mono text-xs">
                      {t.trade_date}
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {t.ticker}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          t.side === "buy" ? "default" : "destructive"
                        }
                        className="text-[10px] px-1.5 py-0 uppercase"
                      >
                        {t.side}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {fmt(t.quantity, 4)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {fmtCurrency(t.price)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {fmtCurrency(t.total)}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </FadeIn>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  3. Dividends Tab                                                  */
/* ────────────────────────────────────────────────────────────────── */

function DividendsTab({ accounts }: { accounts: AccountItem[] }) {
  const { data: dividends, isLoading } = useDividends();
  const createDividend = useCreateDividend();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    account_id: accounts[0]?.id ?? "",
    ticker: "",
    amount: "",
    per_share: "",
    pay_date: new Date().toISOString().slice(0, 10),
  });

  const handleSubmit = () => {
    if (!form.ticker || !form.amount) return;
    createDividend.mutate(
      {
        account_id: form.account_id,
        ticker: form.ticker,
        amount: parseFloat(form.amount),
        per_share: form.per_share ? parseFloat(form.per_share) : undefined,
        pay_date: form.pay_date || undefined,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm((f) => ({ ...f, ticker: "", amount: "", per_share: "" }));
        },
      }
    );
  };

  const totalDividends = (dividends ?? []).reduce(
    (s, d) => s + d.amount,
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold">Dividend History</h2>
          {totalDividends > 0 && (
            <span className="text-xs text-muted-foreground font-mono">
              Total:{" "}
              <span className="text-positive glow-positive">
                {fmtCurrency(totalDividends)}
              </span>
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Log Dividend
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <SlideIn direction="down">
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <Label className="text-xs">Account</Label>
                  <Select
                    value={form.account_id}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, account_id: v }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Ticker</Label>
                  <Input
                    className="mt-1 uppercase font-mono"
                    placeholder="AAPL"
                    value={form.ticker}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, ticker: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Total Amount</Label>
                  <Input
                    className="mt-1 font-mono"
                    type="number"
                    step="any"
                    placeholder="45.00"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, amount: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Per Share (optional)</Label>
                  <Input
                    className="mt-1 font-mono"
                    type="number"
                    step="any"
                    placeholder="0.24"
                    value={form.per_share}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, per_share: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Pay Date</Label>
                  <Input
                    className="mt-1 font-mono"
                    type="date"
                    value={form.pay_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, pay_date: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={createDividend.isPending}
                >
                  {createDividend.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Submit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
              {createDividend.error && (
                <p className="text-xs text-destructive">
                  {createDividend.error.message}
                </p>
              )}
            </div>
          </SlideIn>
        )}
      </AnimatePresence>

      {isLoading ? (
        <Skeleton className="h-36 rounded-lg skeleton-shimmer" />
      ) : (dividends ?? []).length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No dividends recorded yet.
          </p>
        </div>
      ) : (
        <FadeIn delay={0.1}>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pay Date</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Per Share</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(dividends ?? []).map((d: DividendResponse, i: number) => (
                  <motion.tr
                    key={d.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.25 }}
                    className="border-b border-border transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-mono text-xs">
                      {d.pay_date ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {d.ticker}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {d.per_share ? fmtCurrency(d.per_share) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-positive glow-positive">
                      +{fmtCurrency(d.amount)}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </FadeIn>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  4. DRIP Calculator                                                */
/* ────────────────────────────────────────────────────────────────── */

interface DripRow {
  year: number;
  shares: number;
  dividendIncome: number;
  reinvestedShares: number;
  totalValue: number;
}

function DripCalculator() {
  const [shares, setShares] = useState("100");
  const [price, setPrice] = useState("150");
  const [yieldPct, setYieldPct] = useState("3");
  const [growthPct, setGrowthPct] = useState("7");
  const [dripPct, setDripPct] = useState("100");
  const [years, setYears] = useState("10");

  const rows = useMemo<DripRow[]>(() => {
    const n = parseInt(years) || 10;
    const initShares = parseFloat(shares) || 0;
    const initPrice = parseFloat(price) || 0;
    const annualYield = (parseFloat(yieldPct) || 0) / 100;
    const annualGrowth = (parseFloat(growthPct) || 0) / 100;
    const reinvestPct = (parseFloat(dripPct) || 0) / 100;

    const result: DripRow[] = [];
    let currentShares = initShares;
    let currentPrice = initPrice;

    for (let yr = 1; yr <= n; yr++) {
      currentPrice *= 1 + annualGrowth;
      const dividendIncome = currentShares * currentPrice * annualYield;
      const reinvestedAmount = dividendIncome * reinvestPct;
      const reinvestedShares =
        currentPrice > 0 ? reinvestedAmount / currentPrice : 0;
      currentShares += reinvestedShares;
      const totalValue = currentShares * currentPrice;

      result.push({
        year: yr,
        shares: currentShares,
        dividendIncome,
        reinvestedShares,
        totalValue,
      });
    }

    return result;
  }, [shares, price, yieldPct, growthPct, dripPct, years]);

  const initValue = (parseFloat(shares) || 0) * (parseFloat(price) || 0);
  const finalRow = rows[rows.length - 1];
  const totalReturn = finalRow
    ? ((finalRow.totalValue - initValue) / (initValue || 1)) * 100
    : 0;

  return (
    <div className="space-y-4">
      <div className="card-hover rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold mb-3">DRIP Calculator</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Project the growth of a dividend-reinvesting portfolio over time.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <Label className="text-xs">Shares</Label>
            <Input
              className="mt-1 font-mono"
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Share Price ($)</Label>
            <Input
              className="mt-1 font-mono"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Dividend Yield %</Label>
            <Input
              className="mt-1 font-mono"
              type="number"
              step="0.1"
              value={yieldPct}
              onChange={(e) => setYieldPct(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Price Growth %</Label>
            <Input
              className="mt-1 font-mono"
              type="number"
              step="0.1"
              value={growthPct}
              onChange={(e) => setGrowthPct(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Reinvest %</Label>
            <Input
              className="mt-1 font-mono"
              type="number"
              value={dripPct}
              onChange={(e) => setDripPct(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Years</Label>
            <Input
              className="mt-1 font-mono"
              type="number"
              value={years}
              onChange={(e) => setYears(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      {finalRow && (
        <StaggerList className="grid grid-cols-3 gap-4">
          <StaggerItem>
            <div className="card-hover rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">
                Initial Investment
              </p>
              <AnimatedNumber
                value={initValue}
                format="currency"
                className="mt-1 block text-lg font-semibold font-mono"
              />
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="card-hover rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">
                Projected Final Value
              </p>
              <AnimatedNumber
                value={finalRow.totalValue}
                format="currency"
                className="mt-1 block text-lg font-semibold font-mono text-positive glow-positive"
              />
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="card-hover rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Total Return</p>
              <AnimatedNumber
                value={totalReturn}
                format="percent"
                className="mt-1 block text-lg font-semibold font-mono text-positive glow-positive"
              />
            </div>
          </StaggerItem>
        </StaggerList>
      )}

      {/* Projection table */}
      {rows.length > 0 && (
        <FadeIn delay={0.2}>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Div Income</TableHead>
                  <TableHead className="text-right">Reinvested</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <motion.tr
                    key={r.year}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.03 }}
                    className="border-b border-border transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-mono">{r.year}</TableCell>
                    <TableCell className="text-right font-mono">
                      {fmt(r.shares, 2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-positive">
                      +{fmtCurrency(r.dividendIncome)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {fmt(r.reinvestedShares, 4)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {fmtCurrency(r.totalValue)}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
