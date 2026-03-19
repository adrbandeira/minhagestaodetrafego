
ALTER TABLE public.ad_balances 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT '',
ADD COLUMN IF NOT EXISTS last_payment_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_payment_date text DEFAULT '';
