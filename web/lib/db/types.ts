import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types"; 

/*
 * FEATURE: Supabase Browser Client
 * PRINCIPLE: Singleton/Factory Pattern
 * * WHY: We use this function to ensure we only have one instance of the
 * Supabase client running in the browser. This prevents multiple
 * WebSocket connections and keeps our auth state consistent.
 */
export function supabaseBrowser() {
    // TypeScript '!' operator tells the compiler these environment
    // variables will definitely exist at runtime.
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

/*
 * PRINCIPLE: Financial Precision
 * * WHY: JavaScript's 'number' type uses 64-bit floats. This causes 
 * '0.1 + 0.2' to equal '0.30000000000000004'. By using minor units
 * (like cents), we perform all math with integers, avoiding this.
 */
export const calculateTotal = (amount: number): number => {
    return Math.round(amount * 100); // Convert to minor units (e.g., cents)
};