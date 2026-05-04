import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://yypqxeqolmbaccnwpuml.supabase.co', 'sb_publishable_tuGYMIS4awQx7LNJia4v9w_4XtYLm1n');

async function run() {
  const { data, error } = await supabase.from('tasks').select('*');
  const grouped = {};
  data.forEach(d => {
    const key = d.child_name + '_' + d.task_name;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(d);
  });
  
  for (const key of Object.keys(grouped)) {
    const rows = grouped[key];
    if (rows.length > 1) {
       rows.sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
       const toDelete = rows.slice(1).map(r => r.id);
       if (toDelete.length > 0) {
           await supabase.from('tasks').delete().in('id', toDelete);
           console.log("Deleted", toDelete.length, "for", key);
       }
    }
  }
}

run();
