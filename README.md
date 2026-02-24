# Charlie Budget

A simple personal budgeting web app

Frontend design
```mermaid
flowchart TB
A["App Shell"] --> B["Left Nav / Bottom Tabs"]
B --> D["Dashboard"]
B --> T["Transactions"]
B --> C["Categories"]
B --> G["Budgets"]
B --> R["Reports"]
B --> S["Settings"]

D --> D1["Net worth card"]
D --> D2["This month: income vs spend"]
D --> D3["Top categories"]
D --> D4["Budget progress bars"]
D --> D5["Recent transactions"]

T --> T1["Search + filters + bulk edit"]
G --> G1["Category budget editor"]
R --> R1["Monthly trend + cashflow charts"]
```
```aiignore
erDiagram
    %% Auth Mirror
    profiles {
        uuid id PK
        text display_name
        timestamptz created_at
    }

    %% Categorization
    categories {
        uuid id PK
        uuid user_id FK
        text name
        text kind
        int sort_order
        boolean archived
        timestamptz created_at
    }

    %% Banking
    accounts {
        uuid id PK
        uuid user_id FK
        text name
        text type
        text source
        text plaid_account_id
        text currency
        numeric current_balance
        timestamptz balance_as_of
        boolean archived
        timestamptz created_at
    }

    %% Ledger
    transactions {
        uuid id PK
        uuid user_id FK
        uuid account_id FK
        uuid category_id FK
        date txn_date
        numeric amount
        text merchant
        text note
        text source
        text plaid_transaction_id
        boolean pending
        timestamptz deleted_at
        timestamptz created_at
    }

    %% Budgeting
    budgets {
        uuid id PK
        uuid user_id FK
        date month
        timestamptz created_at
    }

    budget_lines {
        uuid id PK
        uuid budget_id FK
        uuid category_id FK
        numeric planned_amount
        timestamptz created_at
    }

    %% Relationships
    profiles ||--|| categories : "owns"
    profiles ||--o{ accounts : "owns"
    profiles ||--o{ transactions : "owns"
    profiles ||--o{ budgets : "owns"

    accounts ||--o{ transactions : "contains"
    categories ||--o{ transactions : "classifies"
    
    budgets ||--o{ budget_lines : "contains"
    categories ||--o{ budget_lines : "defines"
```