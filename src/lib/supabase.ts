import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Patient = {
  id: string;
  name: string;
  dob: string;
  diagnoses: string[];
  clinical_notes: string;
  created_at: string;
  updated_at: string;
};

export type Session = {
  id: string;
  patient_id: string;
  date: string;
  duration: number;
  engine_stats: Record<string, unknown>;
  created_at: string;
};

export type Milestone = {
  id: string;
  session_id: string;
  achievement_type: string;
  raw_data_snapshot: Record<string, unknown>;
  created_at: string;
};

export async function createPatient(data: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Promise<Patient | null> {
  const { data: patient, error } = await supabase
    .from('patients')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return patient;
}

export async function getPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updatePatient(id: string, data: Partial<Patient>): Promise<Patient | null> {
  const { data: patient, error } = await supabase
    .from('patients')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return patient;
}

export async function createSession(data: Omit<Session, 'id' | 'created_at'>): Promise<Session | null> {
  const { data: session, error } = await supabase
    .from('sessions')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return session;
}

export async function getSessionsByPatient(patientId: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('patient_id', patientId)
    .order('date', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createMilestone(data: Omit<Milestone, 'id' | 'created_at'>): Promise<Milestone | null> {
  const { data: milestone, error } = await supabase
    .from('milestones')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return milestone;
}

export async function getMilestonesBySession(sessionId: string): Promise<Milestone[]> {
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}
