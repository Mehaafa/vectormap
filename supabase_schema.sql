-- Phase 1: VectorMap Pro Schema Initialization
-- Execute this script in your Supabase SQL Editor

-- 1. Create Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Sequences Table (using JSONB for flexible parsed data from bio-parsers)
CREATE TABLE IF NOT EXISTS public.sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'DNA', -- DNA, RNA, PROT
  size_bp INTEGER,
  is_circular BOOLEAN DEFAULT false,
  -- We store the entire parsed OVE JSON data here for frontend hydration
  sequence_data JSONB NOT NULL, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS) policies 
-- Default permissive policies for prototype (WARNING: Restrict in production)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.projects FOR DELETE USING (true);

ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.sequences FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.sequences FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.sequences FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.sequences FOR DELETE USING (true);

-- Insert a Mock Project
INSERT INTO public.projects (name, description) 
VALUES ('pUC19 Optimization', 'Mock project for Vector Map Phase 1 testing')
ON CONFLICT DO NOTHING;
