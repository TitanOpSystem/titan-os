import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Copy .env.example to .env.local and fill in your credentials.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Families ─────────────────────────────────────────────────
export const getFamilies = async () => {
  const { data, error } = await supabase
    .from('families')
    .select('*, properties(count), documents(count)')
    .order('name');
  if (error) throw error;
  return data;
};

export const createFamily = async (family) => {
  const { data, error } = await supabase.from('families').insert(family).select().single();
  if (error) throw error;
  await logActivity(data.id, `Family "${data.name}" created`, 'family', data.id);
  return data;
};

export const updateFamily = async (id, updates) => {
  const { data, error } = await supabase.from('families').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteFamily = async (id) => {
  const { error } = await supabase.from('families').delete().eq('id', id);
  if (error) throw error;
};

// ── Properties ───────────────────────────────────────────────
export const getProperties = async (familyId = null) => {
  let query = supabase
    .from('properties')
    .select('*, families(name, color)')
    .order('name');
  if (familyId) query = query.eq('family_id', familyId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createProperty = async (property) => {
  const { data, error } = await supabase.from('properties').insert(property).select().single();
  if (error) throw error;
  await logActivity(property.family_id, `Property "${data.name}" added`, 'property', data.id);
  return data;
};

export const updateProperty = async (id, updates) => {
  const { data, error } = await supabase.from('properties').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteProperty = async (id) => {
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) throw error;
};

// ── Documents ────────────────────────────────────────────────
export const getDocuments = async ({ familyId, propertyId, docType } = {}) => {
  let query = supabase
    .from('documents')
    .select('*, families(name), properties(name)')
    .order('created_at', { ascending: false });
  if (familyId) query = query.eq('family_id', familyId);
  if (propertyId) query = query.eq('property_id', propertyId);
  if (docType) query = query.eq('doc_type', docType);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const uploadDocument = async ({ file, familyId, propertyId, docType, expiryDate, notes }) => {
  const ext = file.name.split('.').pop();
  const filePath = `${familyId}/${propertyId || 'general'}/${Date.now()}_${file.name}`;

  // Upload file to storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .upload(filePath, file, { contentType: file.type });
  if (storageError) throw storageError;

  // Save metadata to DB
  const { data, error } = await supabase.from('documents').insert({
    family_id: familyId,
    property_id: propertyId || null,
    name: file.name,
    doc_type: docType,
    file_path: filePath,
    file_size: file.size,
    mime_type: file.type,
    expiry_date: expiryDate || null,
    notes,
  }).select().single();
  if (error) throw error;

  await logActivity(familyId, `Document "${file.name}" uploaded`, 'document', data.id);
  return data;
};

export const getDocumentUrl = async (filePath) => {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 3600); // 1 hour expiry
  if (error) throw error;
  return data.signedUrl;
};

export const deleteDocument = async (id, filePath) => {
  await supabase.storage.from('documents').remove([filePath]);
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
};

// ── Deadlines ────────────────────────────────────────────────
export const getDeadlines = async (familyId = null) => {
  let query = supabase
    .from('deadlines')
    .select('*, families(name), properties(name)')
    .eq('completed', false)
    .order('due_date');
  if (familyId) query = query.eq('family_id', familyId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createDeadline = async (deadline) => {
  const { data, error } = await supabase.from('deadlines').insert(deadline).select().single();
  if (error) throw error;
  return data;
};

export const completeDeadline = async (id) => {
  const { data, error } = await supabase.from('deadlines').update({ completed: true }).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteDeadline = async (id) => {
  const { error } = await supabase.from('deadlines').delete().eq('id', id);
  if (error) throw error;
};

// ── Activity Log ─────────────────────────────────────────────
export const logActivity = async (familyId, action, entityType, entityId) => {
  await supabase.from('activity_log').insert({ family_id: familyId, action, entity_type: entityType, entity_id: entityId });
};

export const getActivity = async (limit = 20) => {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*, families(name, color)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
};

// ── Auth ─────────────────────────────────────────────────────
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};
