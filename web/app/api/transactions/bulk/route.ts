import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error } from "@/lib/api/response";

export async function PATCH(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json();
  const { ids, action, category_id } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return error("ids must be a non-empty array", 400);
  }
  if (!["recategorize", "delete"].includes(action)) {
    return error("action must be recategorize or delete", 400);
  }
  if (action === "recategorize" && !category_id) {
    return error("category_id is required when action is recategorize", 400);
  }

  let count = 0;

  if (action === "recategorize") {
    const { count: n } = await supabase
      .from("transactions")
      .update({ category_id })
      .in("id", ids)
      .is("deleted_at", null);
    count = n ?? 0;
  } else {
    const { count: n } = await supabase
      .from("transactions")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", ids)
      .is("deleted_at", null);
    count = n ?? 0;
  }

  return json({ updated: count });
}
