#!/usr/bin/env node
import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

/*
  Script: updateImages.mjs
  Objetivo: Listar todos os objetos (arquivos) na raiz de um bucket de Storage
            do Supabase (default: chat-cars) e mapear sequencialmente nos carros
            em data/cars.json substituindo o campo Image.

  Variáveis de ambiente necessárias:
    NEXT_PUBLIC_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY (se o bucket for público de leitura) OU
    SUPABASE_SERVICE_ROLE (para buckets privados)
    TARGET_BUCKET (opcional, default chat-cars)
    PUBLIC_BASE (opcional) -> sobrescreve URL pública (ex: CDN)

  Uso:
    npm run update:car-images

  Observações:
    - Se houver mais carros que imagens, os restantes mantêm o valor original.
    - Se houver mais imagens que carros, as extras são ignoradas.
    - Requer política de `select` no bucket ou uso do service role.
*/

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getSupabaseClient() {
  const url = 'https://osuswsunkhuirecnbsfj.supabase.co';
  const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdXN3c3Vua2h1aXJlY25ic2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MTAxNjAsImV4cCI6MjA3NTI4NjE2MH0.aHmGIRqELVr8hlRYmyOj5iV7CWZJwlUWeOanzu0kLas';
  const service = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdXN3c3Vua2h1aXJlY25ic2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTcxMDE2MCwiZXhwIjoyMDc1Mjg2MTYwfQ.lDyJc9zJ1a-64EHDtNQLZ4aOvntvO-7APw8b0rPrcVo';
  if (!url) {
    console.error('NEXT_PUBLIC_SUPABASE_URL ausente');
    process.exit(1);
  }
  const key = service || anon;
  if (!key) {
    console.error('Forneça SUPABASE_SERVICE_ROLE ou NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function listBucketFiles(supabase, bucket) {
  // Lista apenas a primeira “página”; se precisar mais, implemente paginação (limit/offset)
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .list('', { limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } });
  if (error) throw error;
  return (data || [])
    .filter(o => !o.name.endsWith('/')) // ignora “pastas”
    .map(o => o.name);
}

function buildPublicUrl(bucket, file) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '')}/${encodeURIComponent(file)}`;
  }
  // Padrão de URL pública do Supabase Storage (quando público)
  const base = 'https://osuswsunkhuirecnbsfj.supabase.co';
  return `${base}/storage/v1/object/public/${bucket}/${encodeURIComponent(file)}`;
}

async function main() {
  const bucket = process.env.TARGET_BUCKET || 'chat-cars';
  const supabase = getSupabaseClient();
  let files;
  try {
    files = await listBucketFiles(supabase, bucket);
  } catch (err) {
    console.error('Falha ao listar arquivos do bucket', bucket, err.message || err);
    process.exit(1);
  }
  if (!files.length) {
    console.warn('Nenhum arquivo encontrado no bucket. Nada a atualizar.');
    return;
  }

  const carsPath = path.join(__dirname, '..', 'data', 'cars.json');
  let carsRaw;
  try {
    carsRaw = await readFile(carsPath, 'utf8');
  } catch (err) {
    console.error('Não foi possível ler cars.json', err);
    process.exit(1);
  }
  let cars;
  try {
    cars = JSON.parse(carsRaw);
  } catch (err) {
    console.error('cars.json não é JSON válido', err);
    process.exit(1);
  }
  if (!Array.isArray(cars)) {
    console.error('cars.json precisa ter um array na raiz');
    process.exit(1);
  }

  const updated = cars.map((car, idx) => {
    if (files[idx]) {
      const imageUrl = buildPublicUrl(bucket, files[idx]);
      return { ...car, Image: imageUrl };
    }
    return car;
  });

  await writeFile(carsPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  console.log(`Atualizados ${Math.min(files.length, updated.length)} carros com imagens do bucket '${bucket}'.`);
}

main().catch(err => {
  console.error('Erro inesperado', err);
  process.exit(1);
});
