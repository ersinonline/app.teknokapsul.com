import emailjs from '@emailjs/browser';

// EmailJS configuration - using VITE_ prefix for Vite environment variables
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

export interface DebtNotificationData {
  to_email: string;
  to_name: string;
  debt_description: string;
  debt_amount: string;
  debt_creditor: string;
  debt_due_date: string;
  debt_notes?: string;
}

export interface ExpenseNotificationData {
  to_email: string;
  to_name: string;
  expense_title: string;
  expense_amount: string;
  expense_category: string;
  expense_date: string;
  is_installment: boolean;
  installment_info?: string;
}

export interface ExpenseReminderData {
  to_email: string;
  to_name: string;
  expense_title: string;
  expense_amount: string;
  expense_category: string;
  expense_due_date: string;
  days_until_due: string;
}

export const sendDebtNotification = async (data: DebtNotificationData): Promise<boolean> => {
  try {
    // Check if EmailJS is properly configured
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      console.warn('EmailJS not configured. Skipping email notification.');
      return false;
    }

    const templateParams = {
      to_email: data.to_email,
      to_name: data.to_name,
      debt_description: data.debt_description,
      debt_amount: data.debt_amount,
      debt_creditor: data.debt_creditor,
      debt_due_date: data.debt_due_date,
      debt_notes: data.debt_notes || 'Belirtilmemiş',
      from_name: 'TeknokapsulApp',
      reply_to: 'noreply@teknokapsul.com'
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    if (response.status === 200) {
      console.log('Debt notification email sent successfully:', response);
      return true;
    } else {
      console.error('Failed to send debt notification email:', response);
      return false;
    }
  } catch (error) {
    console.error('Error sending debt notification email:', error);
    return false;
  }
};

export const validateEmailConfiguration = (): boolean => {
  return !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);
};

export const sendExpenseNotification = async (data: ExpenseNotificationData): Promise<boolean> => {
  try {
    // Check if EmailJS is properly configured
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      console.warn('EmailJS not configured for expense notifications. Skipping email notification.');
      return false;
    }

    const templateParams = {
      to_email: data.to_email,
      to_name: data.to_name,
      expense_title: data.expense_title,
      expense_amount: data.expense_amount,
      expense_category: data.expense_category,
      expense_date: data.expense_date,
      is_installment: data.is_installment ? 'Evet' : 'Hayır',
      installment_info: data.installment_info || 'Tek seferlik ödeme',
      from_name: 'TeknokapsulApp',
      reply_to: 'noreply@teknokapsul.com'
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    if (response.status === 200) {
      console.log('Expense notification email sent successfully:', response);
      return true;
    } else {
      console.error('Failed to send expense notification email:', response);
      return false;
    }
  } catch (error) {
    console.error('Error sending expense notification email:', error);
    return false;
  }
};

export const sendExpenseReminder = async (data: ExpenseReminderData): Promise<boolean> => {
  try {
    // Check if EmailJS is properly configured
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      console.warn('EmailJS not configured. Skipping expense reminder email.');
      return false;
    }

    const templateParams = {
      to_email: data.to_email,
      to_name: data.to_name,
      expense_title: data.expense_title,
      expense_amount: data.expense_amount,
      expense_category: data.expense_category,
      expense_due_date: data.expense_due_date,
      days_until_due: data.days_until_due,
      from_name: 'TeknokapsulApp',
      reply_to: 'noreply@teknokapsul.com'
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    if (response.status === 200) {
      console.log('Expense reminder email sent successfully:', response);
      return true;
    } else {
      console.error('Failed to send expense reminder email:', response);
      return false;
    }
  } catch (error) {
    console.error('Error sending expense reminder email:', error);
    return false;
  }
};