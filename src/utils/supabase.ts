import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yypqxeqolmbaccnwpuml.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_tuGYMIS4awQx7LNJia4v9w_4XtYLm1n';

export const supabase = createClient(supabaseUrl, supabaseKey);
