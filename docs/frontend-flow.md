# Frontend User Flows

## 1. Onboarding & Auth

```mermaid
flowchart TD
    Start([User visits app]) --> AuthCheck{Authenticated?}
    AuthCheck -->|Yes| HasAccounts{Has linked accounts?}
    AuthCheck -->|No| AuthPage[Auth Page]

    AuthPage --> Login[Login]
    AuthPage --> SignUp[Sign Up]
    AuthPage --> ForgotPW[Forgot Password]

    ForgotPW --> ResetEmail[Send reset email]
    ResetEmail --> ResetLink[User clicks link]
    ResetLink --> NewPassword[Set new password]
    NewPassword --> Login

    SignUp --> EmailVerify{Email verified?}
    EmailVerify -->|No| VerifyPrompt[Check your email prompt]
    VerifyPrompt --> EmailVerify
    EmailVerify -->|Yes| Onboarding

    Login --> LoginResult{Valid credentials?}
    LoginResult -->|No| AuthPage
    LoginResult -->|Yes| HasAccounts

    HasAccounts -->|No| Onboarding[Onboarding: Connect your first bank]
    HasAccounts -->|Yes| Dashboard[Dashboard]

    Onboarding --> PlaidLink[Plaid Link modal]
    PlaidLink --> PLResult{Result}
    PLResult -->|Cancelled| Onboarding
    PLResult -->|Error| PLError[Show error + retry]
    PLError --> PlaidLink
    PLResult -->|Success| SyncTxns[Sync transactions in background]
    SyncTxns --> Dashboard
```

---

## 2. Bank Connection

```mermaid
flowchart TD
    AccountsPage[Accounts Page] --> ConnectBtn[Click: Connect Bank]
    ConnectBtn --> CreateLinkToken[POST /api/plaid/link-token]
    CreateLinkToken --> PlaidLink[Open Plaid Link modal]

    PlaidLink --> PLResult{User action}
    PLResult -->|Cancelled| AccountsPage
    PLResult -->|Success| ExchangeToken[POST /api/plaid/exchange-token]

    ExchangeToken --> StoreToken[Store encrypted token in plaid_items]
    StoreToken --> FetchAccounts[Fetch accounts from Plaid]
    FetchAccounts --> SyncTxns[Sync transactions via cursor]
    SyncTxns --> ShowAccounts[Show new accounts + transactions]
    ShowAccounts --> AccountsPage
```

---

## 3. Transaction Management

```mermaid
flowchart TD
    TxnList[Transactions List] --> UserAction{User action}

    UserAction -->|Search / filter| FilteredList[Filtered results]
    FilteredList --> UserAction

    UserAction -->|Click row| SlideOver[Transaction slide-over panel]
    SlideOver --> EditAction{Edit action}
    EditAction -->|Change category| CatPicker[Category picker]
    EditAction -->|Edit note| NoteField[Note input]
    EditAction -->|Split transaction| SplitFlow[Split into multiple rows]
    CatPicker --> Save[Save]
    NoteField --> Save
    SplitFlow --> Save
    Save --> TxnList

    UserAction -->|Select rows| BulkMode[Bulk selection mode]
    BulkMode --> BulkAction{Bulk action}
    BulkAction -->|Recategorize| BulkCat[Apply category to selected]
    BulkAction -->|Delete| ConfirmDelete{Confirm?}
    ConfirmDelete -->|No| BulkMode
    ConfirmDelete -->|Yes| SoftDelete[Soft delete]
    BulkCat --> TxnList
    SoftDelete --> TxnList
```

---

## 4. Budget Management

```mermaid
flowchart TD
    BudgetPage[Budget Page] --> MonthNav{Navigate month}

    MonthNav -->|Past month| ReadOnly[Read-only view of actuals vs planned]
    MonthNav -->|Current month| Editor[Budget editor]
    MonthNav -->|Future month| BudgetExists{Budget exists?}

    BudgetExists -->|Yes| Editor
    BudgetExists -->|No| CreateOptions{Create from}
    CreateOptions -->|Copy last month| CopyBudget[Copy previous amounts]
    CreateOptions -->|Start blank| BlankBudget[Empty editor]
    CopyBudget --> Editor
    BlankBudget --> Editor

    Editor --> SetAmounts[Set planned amount per category]
    SetAmounts --> Progress[Show actuals vs planned in real time]
    Progress --> Alert{Any category over budget?}
    Alert -->|Yes| OverHighlight[Highlight row in red]
    Alert -->|No| GreenState[All within budget]
```

---

## 5. Plaid Re-auth (Item Error Handling)

```mermaid
flowchart TD
    Webhook([Plaid webhook: ITEM_LOGIN_REQUIRED]) --> EdgeFn[Supabase Edge Function]
    EdgeFn --> VerifySig{Valid JWT signature?}
    VerifySig -->|No| Drop[Discard request]
    VerifySig -->|Yes| FlagItem[Set plaid_item.needs_reauth = true]

    FlagItem --> UserSees[User sees alert banner on Dashboard / Accounts]
    UserSees --> ClickFix[Click: Fix connection]
    ClickFix --> UpdateToken[POST /api/plaid/link-token?mode=update]
    UpdateToken --> PlaidUpdate[Open Plaid Link in update mode]

    PlaidUpdate --> Result{Result}
    Result -->|Error| RetryPrompt[Show error + retry]
    RetryPrompt --> ClickFix
    Result -->|Success| ClearFlag[Clear needs_reauth flag]
    ClearFlag --> Resync[Re-sync transactions]
    Resync --> Dashboard[Dashboard: data fresh]
```

---

## 6. Investments

```mermaid
flowchart TD
    InvestPage[Investments Page] --> Action{User action}

    Action -->|View holdings| Holdings[Holdings table]
    Holdings --> HoldingRow[Click row]
    HoldingRow --> Detail[Price chart + trade history]

    Action -->|Log trade| TradeForm[Buy / Sell form]
    TradeForm --> TradeFields[Ticker · shares · price · date]
    TradeFields --> UpdateHolding[Recalculate avg cost + quantity]
    UpdateHolding --> Holdings

    Action -->|Log dividend| DivForm[Dividend entry form]
    DivForm --> DivLog[Dividends log]

    Action -->|DRIP calculator| DRIP[DRIP Calculator]
    DRIP --> DRIPInputs[Inputs: shares · yield · DRIP % · years]
    DRIPInputs --> DRIPChart[Projected value + dividend income chart]
```

---

## 7. Settings

```mermaid
flowchart TD
    SettingsPage[Settings] --> Section{Section}

    Section --> Profile[Profile]
    Profile --> EditName[Edit display name]
    EditName --> Save[Save]

    Section --> Currency[Base Currency]
    Currency --> CurrencyFlow[See Flow 8: Currency Change]

    Section --> ConnectedAccounts[Connected Accounts]
    ConnectedAccounts --> AccountRow{Account action}
    AccountRow -->|Sync now| ManualSync[Trigger manual sync]
    AccountRow -->|Re-auth| ReauthFlow[Plaid Link update mode]
    AccountRow -->|Disconnect| ConfirmDisconnect{Confirm?}
    ConfirmDisconnect -->|Yes| RevokeToken[Revoke Plaid token + delete item]
    ConfirmDisconnect -->|No| ConnectedAccounts

    Section --> Export[Export Data]
    Export --> ExportFormat[Choose format: CSV / JSON]
    ExportFormat --> Download[Download file]

    Section --> DeleteAccount[Delete Account]
    DeleteAccount --> ConfirmDelete{Type to confirm}
    ConfirmDelete -->|Confirmed| Wipe[Revoke tokens · delete all data · sign out]
```

---

## 8. Currency Change

> Triggered from Settings → Base Currency.
>
> **Key constraint:** Open Exchange Rates free tier only returns rates relative to USD.
> To convert between two non-USD currencies: `rate_A_to_B = rate_USD_to_B / rate_USD_to_A`.
> Historical rates are cached in the `fx_rates` table to avoid redundant API calls.

```mermaid
flowchart TD
    CurrencyPicker[User selects new base currency] --> Confirm{Confirm dialog}
    Confirm -->|Cancel| Settings[Back to Settings]
    Confirm -->|Confirm| PostAPI[POST /api/settings/currency]

    PostAPI --> GetTxnDates[Query: distinct txn_date + currency pairs needing conversion]
    GetTxnDates --> CheckCache{Rate cached in fx_rates?}

    CheckCache -->|Yes| UseCache[Use cached rate]
    CheckCache -->|No| FetchOER[Fetch from Open Exchange Rates historical API]
    FetchOER --> RateResult{API success?}
    RateResult -->|Error| ReturnError[Return 500 + show toast error]
    RateResult -->|OK| StoreCache[Insert into fx_rates table]
    StoreCache --> UseCache

    UseCache --> Calc["Calc: amount_base = amount ÷ rate(txn.currency→USD) × rate(newBase→USD)"]
    Calc --> BatchUpdate[Batch UPDATE transactions SET amount_base]
    BatchUpdate --> MoreDates{More dates?}
    MoreDates -->|Yes| CheckCache
    MoreDates -->|No| UpdateProfile[UPDATE profiles SET base_currency = newBase]
    UpdateProfile --> Done[Return 200]
    Done --> Invalidate[Frontend: invalidate all cached queries]
    Invalidate --> Dashboard[Reload Dashboard with new currency]
```
