const { createClient } = require('@supabase/supabase-js');

// Load env vars manually since we are running a standalone script
const url = 'https://supabase.devsystech.com.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

async function test() {
    console.log("--- Testing with ANON Key (RLS Enforced) ---");
    const anonClient = createClient(url, anonKey);
    const { data: dataAnon, error: errorAnon } = await anonClient.from('clientes').select('*');
    if (errorAnon) console.error("Anon Error:", errorAnon.message);
    else console.log(`Anon Rows: ${dataAnon.length}`);

    console.log("\n--- Testing with SERVICE_ROLE Key (Bypasses RLS) ---");
    const serviceClient = createClient(url, serviceKey);
    const { data: dataService, error: errorService } = await serviceClient.from('clientes').select('*');
    if (errorService) console.error("Service Error:", errorService.message);
    else {
        console.log(`Service Role Rows: ${dataService.length}`);
        if (dataService.length > 0) {
            console.log("Sample Data:", dataService[0]);
        } else {
            // Attempt to insert a test record if empty
            console.log("Table is empty. Attempting insertion with Service Role...");
            const { data: insertData, error: insertError } = await serviceClient.from('clientes').insert({
                nombre: "Test Client Script",
                documento: "123456789",
                telefono: "555-0000"
            }).select();

            if (insertError) console.error("Insert Error:", insertError.message);
            else console.log("Inserted Test Record:", insertData);
        }
    }
}

test();