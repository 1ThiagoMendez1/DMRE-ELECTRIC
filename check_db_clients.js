const { createClient } = require('@supabase/supabase-js');

const url = 'https://supabase.devsystech.com.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(url, key);

async function check() {
    console.log("Checking database content...");
    const { data, error } = await supabase.from('clientes').select('*');
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Count:", data.length);
        if (data.length > 0) {
            console.log("First 3 records:");
            console.log(JSON.stringify(data.slice(0, 3), null, 2));
        } else {
            console.log("Table is empty.");
        }
    }
}

check();
