import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yypqxeqolmbaccnwpuml.supabase.co';
const supabaseKey = 'sb_publishable_tuGYMIS4awQx7LNJia4v9w_4XtYLm1n';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('settings').select('*');
  console.log("settings:", data, error);
  const { data: tData, error: tErr } = await supabase.from('tasks').select('*').limit(1);
  console.log("tasks:", tData, tErr);
}
test();
