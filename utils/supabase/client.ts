import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zlneyxiqaeruvieeujis.supabase.co';
const supabaseAnonKey = 'sb_publishable_LAEZ8WOJRxFR_RLEDvwz7Q_ik0CWeqs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
