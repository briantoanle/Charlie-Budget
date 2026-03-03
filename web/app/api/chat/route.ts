import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  if (!process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ 
      error: "OPENAI_API_KEY is not set. Please configure it in your environment variables to use the interactive guide." 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const systemPrompt = `You are Charlie's interactive assistant. Your job is to help users navigate and use the Charlie budgeting app. 
You are friendly, concise, and helpful. Always use simple, clear language.

App Knowledge Base:
1. Dashboard: Shows a summary of your accounts, monthly cash flow, budgets, savings goals, and recent transactions. You can also view a monthly trend chart. To add a manual transaction quickly, use the '+' button on the dashboard.
2. Accounts: Where you manage your bank connections (via Plaid) or manual accounts (cash, manual credit cards). To connect a new bank, click 'Connect Bank' and follow the Plaid flow. To add a manual account, use the 'Add Manual Account' button.
3. Transactions: A detailed ledger of all your income and expenses. Plaid-connected accounts will automatically pull in transactions and attempt to auto-categorize them. You can also create manual transactions here. To verify uncategorized transactions, check the 'Uncategorized' widget on the Dashboard.
4. Budgets: Where you set planned spending limits for specific categories each month. Charlie supports an "envelope budgeting" philosophy where every dollar should have a job.
5. Investments: A portfolio tracker showing your brokerage accounts, holdings, and trades.
6. Settings: Where you manage your profile (name, base currency), view your connected bank accounts, export your data to CSV/JSON, or delete your account entirely. Disconnecting a bank allows you to either "Archive" (keep history) or "Delete" (wipe data).

If a user asks how to do something, provide a clear, step-by-step instruction based on the Knowledge Base above. If they ask a general financial question, give a brief, responsible answer, but clarify you are primarily an app guide, not a certified financial planner.
`;

  try {
    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages,
      temperature: 0.3,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Failed to initialize chat stream" }), { status: 500 });
  }
}
