import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://yypqxeqolmbaccnwpuml.supabase.co', 'sb_publishable_tuGYMIS4awQx7LNJia4v9w_4XtYLm1n');
async function test() {
  const longStr = "x".repeat(1000);
  const { data, error } = await supabase.from('tasks').insert({ child_name: 'system', task_name: longStr, is_completed: false, updated_at: new Date().toISOString() }).select();
  console.log("insert error:", error);
}
test();
