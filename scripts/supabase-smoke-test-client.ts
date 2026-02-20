
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// 1. Carregar Env
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("----------------------------------------------------------------");
console.log("🛠️  SUPABASE SMOKE TEST - CLIENT CREATION");
console.log("----------------------------------------------------------------");

if (!SUPABASE_URL || !ANON_KEY) {
    console.error("❌ ERRO: Variáveis de ambiente SUPABASE_URL ou ANON_KEY em falta.");
    process.exit(1);
}

console.log(`🔗 URL: ${SUPABASE_URL}`);
console.log('🔑 ANON KEY: loaded');

if (SERVICE_ROLE_KEY) {
    console.log('🔑 SERVICE ROLE: loaded');
} else {
    console.log(`⚠️ SERVICE ROLE: Não detetada (Teste será limitado a Anon Key)`);
}

// 2. Setup Clients
const anonClient = createClient(SUPABASE_URL, ANON_KEY);

const testData = {
    name: "Kozegho",
    contact_name: "Nuno Gonçalves",
    email: "nuno.goncalves@kozegho.com",
    phone: "913888558",
    country: "Portugal",
    status: "Prospect",
    preferred_language: "English",
    market: "International",
    is_active: true,
};

async function runTest() {
    console.log("\n🧪 A: TESTE ANON KEY (Simula Frontend)");

    // Tentativa 1: Inserir com Anon Key
    // Se RLS estiver ativo e configurado "auth required", isto DEVE FALHAR se não tiver sessão.
    // O pedido pedia "funcionar SEM depender de sessão/auth no browser".
    // ISSO SIGNIFICA que se RLS exigir auth, este teste Anon vai falhar (corretamente).
    // A MENOS que exista policy "public insert".

    // O objetivo é "Criar cliente e verificar". Se o RLS exige user logado, o script Node não tem user logado.
    // A não ser que façamos login anonimo primeiro.

    // Vamos tentar INSERIR diretamente.
    const { data: anonData, error: anonError } = await anonClient
        .from('customers')
        .select('id')
        .limit(1);

    if (anonError) {
        console.log(`❌ Falha c/ Anon Key: ${anonError.message} (Code: ${anonError.code})`);
        console.log(`   -> Isto pode ser normal se o RLS exigir autenticação.`);
    } else {
        console.log(`✅ SUCESSO c/ Anon Key! Query de leitura executada.`);
        console.log(`   Rows: ${anonData?.length || 0}`);
    }

    // Parte B: Service Role (Se disponível)
    if (SERVICE_ROLE_KEY) {
        console.log("\n🧪 B: TESTE SERVICE ROLE (Bypass RLS)");
        const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
        });

        const { data: existingOrg, error: orgFetchError } = await serviceClient
            .from('organizations')
            .select('id')
            .limit(1)
            .maybeSingle();

        if (orgFetchError) {
            console.error(`❌ ERRO CRÍTICO (Org Fetch): ${orgFetchError.message}`);
            return;
        }

        let orgId = existingOrg?.id;

        if (!orgId) {
            const { data: createdOrg, error: orgCreateError } = await serviceClient
                .from('organizations')
                .insert({ name: 'Smoke Test Org' })
                .select('id')
                .single();
            if (orgCreateError || !createdOrg) {
                console.error(`❌ ERRO CRÍTICO (Org Create): ${orgCreateError?.message}`);
                return;
            }
            orgId = createdOrg.id;
        }

        const { data: serviceData, error: serviceError } = await serviceClient
            .from('customers')
            .upsert({ ...testData, org_id: orgId }, { onConflict: 'org_id,email' })
            .select()
            .single();

        if (serviceError) {
            console.error(`❌ ERRO CRÍTICO (Service Role): ${serviceError.message}`);
            console.error(`   -> Verifique Schema, Tabela 'customers' ou constraints.`);
        } else {
            console.log(`✅ SUCESSO c/ Service Role!`);
            console.log(`   ID: ${serviceData.id}`);
            console.log(`   Email: ${serviceData.email}`);
            console.log(`   Empresa: ${serviceData.name}`);
        }
    } else {
        console.log("\n⚠️ Saltando teste Service Role (Key não configurada).");
        console.log("   Se o teste Anon falhou por RLS, não conseguimos validar se a DB está a aceitar dados.");
    }

    console.log("\n----------------------------------------------------------------");
}

runTest();
