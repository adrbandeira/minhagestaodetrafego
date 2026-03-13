
CREATE TABLE public.ad_balances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  platform text NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  daily_spend numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid,
  UNIQUE(client_id, platform)
);

ALTER TABLE public.ad_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ad_balances_rls" ON public.ad_balances
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
