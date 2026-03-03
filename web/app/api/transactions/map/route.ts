import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { error, json } from "@/lib/api/response";

type Hotspot = {
  key: string;
  lat: number;
  lon: number;
  label: string;
  total_spend: number;
  transactions_count: number;
  merchants: string[];
  last_txn_date: string;
};

export async function GET(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const sp = request.nextUrl.searchParams;
  const account_id = sp.get("account_id");
  const category_id = sp.get("category_id");
  const start_date = sp.get("start_date");
  const end_date = sp.get("end_date");
  const search = sp.get("search");

  let query = supabase
    .from("transactions")
    .select(
      "txn_date, amount, merchant, location_lat, location_lon, location_address, location_city, location_region, location_country"
    )
    .is("deleted_at", null)
    .not("location_lat", "is", null)
    .not("location_lon", "is", null)
    .lt("amount", 0); // expenses only

  if (account_id) query = query.eq("account_id", account_id);
  if (category_id === "uncategorized") {
    query = query.is("category_id", null);
  } else if (category_id) {
    query = query.eq("category_id", category_id);
  }
  if (start_date) query = query.gte("txn_date", start_date);
  if (end_date) query = query.lte("txn_date", end_date);
  if (search) query = query.ilike("merchant", `%${search}%`);

  const { data: rows, error: dbError } = await query;
  if (dbError) return error("Failed to fetch transaction locations", 500);

  const grouped = new Map<string, Hotspot>();

  for (const row of rows ?? []) {
    const lat = row.location_lat;
    const lon = row.location_lon;
    if (lat == null || lon == null) continue;

    const roundedLat = Number(lat.toFixed(4));
    const roundedLon = Number(lon.toFixed(4));
    const key = `${roundedLat},${roundedLon}`;

    const locationParts = [row.location_address, row.location_city, row.location_region, row.location_country]
      .filter(Boolean)
      .join(", ");
    const label = locationParts || row.merchant || "Unknown location";

    const spend = Math.abs(Number(row.amount ?? 0));

    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        key,
        lat: roundedLat,
        lon: roundedLon,
        label,
        total_spend: spend,
        transactions_count: 1,
        merchants: row.merchant ? [row.merchant] : [],
        last_txn_date: row.txn_date,
      });
      continue;
    }

    existing.total_spend += spend;
    existing.transactions_count += 1;
    if (row.merchant && !existing.merchants.includes(row.merchant) && existing.merchants.length < 6) {
      existing.merchants.push(row.merchant);
    }
    if (row.txn_date > existing.last_txn_date) {
      existing.last_txn_date = row.txn_date;
    }
  }

  const hotspots = Array.from(grouped.values()).sort((a, b) => b.total_spend - a.total_spend);

  return json({
    hotspots,
    summary: {
      hotspots_count: hotspots.length,
      transactions_mapped: hotspots.reduce((sum, h) => sum + h.transactions_count, 0),
      total_spend: hotspots.reduce((sum, h) => sum + h.total_spend, 0),
    },
  });
}
