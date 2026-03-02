import { NextRequest } from "next/server";
import { getAuth } from "@/lib/api/auth";
import { json, error, created } from "@/lib/api/response";
import { AccountService } from "@/lib/api/services/account.service";
import { z } from "zod";

const createAccountSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.string().min(1, "Type is required"),
  currency: z.string().optional().default("USD"),
  current_balance: z.number().nullable().optional(),
});

export async function GET() {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  try {
    const accountService = new AccountService(supabase, user);
    const accounts = await accountService.getAccounts();
    return json({ accounts });
  } catch (err: any) {
    return error(err.message, 500);
  }
}
export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  try {
    const body = await request.json();
    const result = createAccountSchema.safeParse(body);
    
    if (!result.success) {
      return error(result.error.issues[0].message, 400);
    }
  
    const { name, type, currency, current_balance } = result.data;
    
    const accountService = new AccountService(supabase, user);
    const data = await accountService.createAccount(name, type, currency, current_balance ?? undefined);
    
    return created(data);
  } catch (err: any) {
    return error(err.message, 500);
  }
}
