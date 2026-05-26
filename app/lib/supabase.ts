"use client";
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

console.log("ENV URL:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// TESTE — remover depois
supabase
    .from("palavras_do_dia")
    .select("*")
    .then(({ data, error }) => {
        console.log("palavras_do_dia:", data, error);
    });

console.log("SUPABASE CLIENTE", supabase);
