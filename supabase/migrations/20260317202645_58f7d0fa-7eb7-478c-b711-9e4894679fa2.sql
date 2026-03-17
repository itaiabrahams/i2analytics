
CREATE TABLE public.admin_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  content TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only head coaches can manage tasks"
ON public.admin_tasks
FOR ALL
TO authenticated
USING (public.is_head_coach(auth.uid()))
WITH CHECK (public.is_head_coach(auth.uid()));
