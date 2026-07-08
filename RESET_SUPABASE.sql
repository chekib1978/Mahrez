-- =============================================================
-- RESET COMPLET de la base Supabase
-- =============================================================
-- Exécuter DANS LE Supabase SQL Editor
--
-- Supprime TOUT le schéma public (tables, fonctions, données...)
-- puis le recrée à vide, prêt pour database_setup.sql
-- =============================================================

drop schema if exists public cascade;
create schema public;

-- Restaurer les permissions par défaut Supabase
grant all on schema public to postgres;
grant all on schema public to public;
grant all on schema public to anon;
grant all on schema public to authenticated;

-- Réinstaller les extensions essentielles
create extension if not exists pgcrypto with schema public;
create extension if not exists "uuid-ossp" with schema public;
