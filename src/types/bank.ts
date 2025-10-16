export type TransactionType = "debit" | "credit";

export interface BankAccount {
  id: string;
  userId: string;
  bankName: string;
  accountName?: string;
  iban?: string;
  accountNumber?: string;
  currency?: string; // e.g. "TRY", "USD"
  createdAt: number; // epoch millis
  updatedAt: number; // epoch millis
}

export interface BankTransaction {
  id: string; // deterministic id for deduping
  userId: string;
  accountId: string;
  date: number; // epoch millis (UTC)
  amount: number; // positive numbers
  currency?: string; // e.g. "TRY"
  type: TransactionType; // debit (outflow) or credit (inflow)
  description?: string;
  balanceAfter?: number; // optional running balance
  source?: string; // e.g. "akbank-pdf"
  raw?: Record<string, any>; // original parsed fields
  createdAt: number;
}

export interface BankStatementUpload {
  userId: string;
  accountId: string;
  filePath: string; // storage path
  createdAt: number;
  status?: "pending" | "processed" | "error";
  errorMessage?: string;
}