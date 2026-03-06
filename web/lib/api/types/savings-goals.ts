export interface SavingsGoalResponse {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  target_date: string | null;
  color: string | null;
  emoji: string | null;
  archived: boolean;
  created_at: string;
}
