import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error, created } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const includeArchived =
    request.nextUrl.searchParams.get("include_archived") === "true";

  let query = supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (!includeArchived) {
    query = query.eq("archived", false);
  }

  const { data, error: dbError } = await query;

  if (dbError) return error("Failed to fetch categories", 500);

  return json({ categories: data });
}

export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const body = await request.json();
  const { name, kind, sort_order } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return error("name is required", 400);
  }
  if (!["income", "expense", "transfer"].includes(kind)) {
    return error("kind must be income, expense, or transfer", 400);
  }

  // Auto-assign sort_order if not provided
  let order = sort_order;
  if (order == null) {
    const { data: last } = await supabase
      .from("categories")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();
    order = (last?.sort_order ?? 0) + 1;
  }

  const { data, error: dbError } = await supabase
    .from("categories")
    .insert({
      user_id: user.id,
      name: name.trim(),
      kind,
      sort_order: order,
    })
    .select()
    .single();

  if (dbError) {
    if (dbError.code === "23505") {
      return error("A category with that name already exists", 409);
    }
    return error("Failed to create category", 500);
  }

  return created(data);
}
