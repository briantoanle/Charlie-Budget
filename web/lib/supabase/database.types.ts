export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          archived: boolean
          balance_as_of: string | null
          created_at: string
          currency: string
          current_balance: number | null
          id: string
          name: string
          plaid_account_id: string | null
          plaid_item_id: string | null
          source: string
          type: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          balance_as_of?: string | null
          created_at?: string
          currency?: string
          current_balance?: number | null
          id?: string
          name: string
          plaid_account_id?: string | null
          plaid_item_id?: string | null
          source: string
          type: string
          user_id: string
        }
        Update: {
          archived?: boolean
          balance_as_of?: string | null
          created_at?: string
          currency?: string
          current_balance?: number | null
          id?: string
          name?: string
          plaid_account_id?: string | null
          plaid_item_id?: string | null
          source?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_plaid_item_id_fkey"
            columns: ["plaid_item_id"]
            isOneToOne: false
            referencedRelation: "plaid_items"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          diff: Json | null
          id: string
          record_id: string | null
          table_name: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          diff?: Json | null
          id?: string
          record_id?: string | null
          table_name?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          diff?: Json | null
          id?: string
          record_id?: string | null
          table_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      budget_lines: {
        Row: {
          budget_id: string
          category_id: string
          created_at: string
          id: string
          planned_amount: number
        }
        Insert: {
          budget_id: string
          category_id: string
          created_at?: string
          id?: string
          planned_amount: number
        }
        Update: {
          budget_id?: string
          category_id?: string
          created_at?: string
          id?: string
          planned_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          created_at: string
          id: string
          month: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          kind: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          kind: string
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          kind?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      fx_rates: {
        Row: {
          date: string
          fetched_at: string
          rates: Json
        }
        Insert: {
          date: string
          fetched_at?: string
          rates: Json
        }
        Update: {
          date?: string
          fetched_at?: string
          rates?: Json
        }
        Relationships: []
      }
      investment_accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          broker: string | null
          currency: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          broker?: string | null
          currency?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          broker?: string | null
          currency?: string
          created_at?: string
        }
        Relationships: []
      }
      investment_dividends: {
        Row: {
          id: string
          user_id: string
          account_id: string
          ticker: string
          amount: number
          per_share: number | null
          ex_date: string | null
          pay_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          ticker: string
          amount: number
          per_share?: number | null
          ex_date?: string | null
          pay_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          ticker?: string
          amount?: number
          per_share?: number | null
          ex_date?: string | null
          pay_date?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_dividends_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "investment_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_holdings: {
        Row: {
          id: string
          user_id: string
          account_id: string
          ticker: string
          quantity: number
          avg_cost: number
          current_price: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          ticker: string
          quantity: number
          avg_cost: number
          current_price?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          ticker?: string
          quantity?: number
          avg_cost?: number
          current_price?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_holdings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "investment_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_trades: {
        Row: {
          id: string
          user_id: string
          account_id: string
          ticker: string
          side: string
          quantity: number
          price: number
          total: number
          trade_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          ticker: string
          side: string
          quantity: number
          price: number
          total: number
          trade_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          ticker?: string
          side?: string
          quantity?: number
          price?: number
          total?: number
          trade_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_trades_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "investment_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      plaid_items: {
        Row: {
          access_token_enc: string
          created_at: string
          cursor: string | null
          id: string
          institution_id: string
          institution_name: string
          item_id: string
          last_synced_at: string | null
          needs_reauth: boolean
          user_id: string
        }
        Insert: {
          access_token_enc: string
          created_at?: string
          cursor?: string | null
          id?: string
          institution_id: string
          institution_name: string
          item_id: string
          last_synced_at?: string | null
          needs_reauth?: boolean
          user_id: string
        }
        Update: {
          access_token_enc?: string
          created_at?: string
          cursor?: string | null
          id?: string
          institution_id?: string
          institution_name?: string
          item_id?: string
          last_synced_at?: string | null
          needs_reauth?: boolean
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          base_currency: string
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          base_currency?: string
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          archived: boolean
          color: string | null
          created_at: string
          current_amount: number
          currency: string
          emoji: string | null
          id: string
          name: string
          target_amount: number
          target_date: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean
          color?: string | null
          created_at?: string
          current_amount?: number
          currency?: string
          emoji?: string | null
          id?: string
          name: string
          target_amount: number
          target_date?: string | null
          user_id: string
        }
        Update: {
          archived?: boolean
          color?: string | null
          created_at?: string
          current_amount?: number
          currency?: string
          emoji?: string | null
          id?: string
          name?: string
          target_amount?: number
          target_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          amount_base: number | null
          category_id: string | null
          created_at: string
          currency: string
          deleted_at: string | null
          id: string
          location_address: string | null
          location_city: string | null
          location_country: string | null
          location_lat: number | null
          location_lon: number | null
          location_postal_code: string | null
          location_region: string | null
          merchant: string | null
          needs_review: boolean
          note: string | null
          pending: boolean
          plaid_category: string | null
          plaid_transaction_id: string | null
          source: string
          txn_date: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          amount_base?: number | null
          category_id?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          location_address?: string | null
          location_city?: string | null
          location_country?: string | null
          location_lat?: number | null
          location_lon?: number | null
          location_postal_code?: string | null
          location_region?: string | null
          merchant?: string | null
          needs_review?: boolean
          note?: string | null
          pending?: boolean
          plaid_category?: string | null
          plaid_transaction_id?: string | null
          source: string
          txn_date: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          amount_base?: number | null
          category_id?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          location_address?: string | null
          location_city?: string | null
          location_country?: string | null
          location_lat?: number | null
          location_lon?: number | null
          location_postal_code?: string | null
          location_region?: string | null
          merchant?: string | null
          needs_review?: boolean
          note?: string | null
          pending?: boolean
          plaid_category?: string | null
          plaid_transaction_id?: string | null
          source?: string
          txn_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
