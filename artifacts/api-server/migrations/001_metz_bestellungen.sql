-- Migration: metz_bestellungen Tabelle anlegen (falls noch nicht vorhanden)
-- Auf dem Produktionssystem einmalig ausführen

CREATE TABLE IF NOT EXISTS metz_bestellungen (
  id                  SERIAL PRIMARY KEY,
  tenant_id           INTEGER NOT NULL DEFAULT 1,
  market_id           INTEGER,
  datum               VARCHAR(10) NOT NULL,
  kunde_name          VARCHAR(100) NOT NULL,
  kunde_telefon       VARCHAR(50),
  artikel             TEXT NOT NULL,
  menge               VARCHAR(50),
  notizen             TEXT,
  bestellt_kuerzel    VARCHAR(20),
  bestellt_user_id    INTEGER,
  bestellt_am         TIMESTAMP,
  abholdatum          VARCHAR(10),
  abgeholt_kuerzel    VARCHAR(20),
  abgeholt_user_id    INTEGER,
  abgeholt_am         TIMESTAMP,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Spalte abholdatum nachträglich hinzufügen (falls Tabelle bereits existiert aber ohne diese Spalte)
ALTER TABLE metz_bestellungen ADD COLUMN IF NOT EXISTS abholdatum VARCHAR(10);
