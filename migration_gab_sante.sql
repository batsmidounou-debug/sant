-- =============================================================================
-- GAB-SANTE — Migration Complète avec Définition des Tables et Autorisations
-- Projet : Système d'Interconnexion Hospitalière du Gabon
-- Base    : Supabase (PostgreSQL)
--
-- Pour chaque table créée dans cette migration, les autorisations suivantes
-- sont octroyées de manière systématique :
--   1. Sélectionner l'octroi sur public.<table_name> à anonyme (anon)
--   2. Accorder les droits de sélection, d'insertion, de mise à jour et
--      de suppression sur public.<table_name> à authentifié (authenticated)
--   3. Accorder les droits de sélection, d'insertion, de mise à jour et
--      de suppression sur public.<table_name> au rôle de service (service_role)
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. sani_chu_status — Statut et capacité des structures hospitalières
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sani_chu_status (
  id              TEXT        PRIMARY KEY,          -- identifiant court ex: 'chul'
  short_name      TEXT        NOT NULL,             -- ex: 'CHUL'
  full_name       TEXT,                             -- ex: 'Centre Hospitalier Universitaire de Libreville'
  ville           TEXT,                             -- ex: 'Libreville'
  province        TEXT,                             -- ex: 'Estuaire'
  latitude        NUMERIC,
  longitude       NUMERIC,
  total_beds      INTEGER     NOT NULL DEFAULT 0,
  occupied_beds   INTEGER     NOT NULL DEFAULT 0,
  lits_dispo      INTEGER     GENERATED ALWAYS AS (total_beds - occupied_beds) STORED,
  rea_beds        INTEGER     NOT NULL DEFAULT 0,
  rea_occupied    INTEGER     NOT NULL DEFAULT 0,
  rea_dispo       INTEGER     GENERATED ALWAYS AS (rea_beds - rea_occupied) STORED,
  status          TEXT        NOT NULL DEFAULT 'online',  -- 'online' | 'offline'
  last_updated    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Autorisations sani_chu_status :
-- 1. Sélectionner l'octroi sur public.sani_chu_status à anonyme ;
GRANT SELECT ON public.sani_chu_status TO anon;

-- 2. Accorder les droits de sélection, d'insertion, de mise à jour et de suppression sur public.sani_chu_status à authentifié ;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_chu_status TO authenticated;

-- 3. Accorder les droits de sélection, d'insertion, de mise à jour et de suppression sur public.sani_chu_status au rôle de service ;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_chu_status TO service_role;


-- ---------------------------------------------------------------------------
-- 2. sani_patients — Dossiers Médicaux Partagés (DMP)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sani_patients (
  id                TEXT        PRIMARY KEY,        -- UUID ou INS
  ins               TEXT        UNIQUE,             -- Identifiant National de Santé
  cnamgs            TEXT,                           -- N° CNAMGS
  insurance         TEXT,                           -- type d'assurance
  name              TEXT        NOT NULL,
  birthdate         TEXT,
  gender            TEXT,
  blood_type        TEXT,
  allergies         JSONB       NOT NULL DEFAULT '[]',
  chronic_diseases  JSONB       NOT NULL DEFAULT '[]',
  current_location  TEXT,                           -- identifiant CHU actuel
  current_service   TEXT,
  contacts          JSONB,
  history           JSONB       NOT NULL DEFAULT '[]',
  medical_history   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patients_ins      ON public.sani_patients (ins);
CREATE INDEX IF NOT EXISTS idx_patients_location ON public.sani_patients (current_location);

-- Autorisations sani_patients :
-- 1. Sélectionner l'octroi sur public.sani_patients à anonyme ;
GRANT SELECT ON public.sani_patients TO anon;

-- 2. Accorder les droits de sélection, d'insertion, de mise à jour et de suppression sur public.sani_patients à authentifié ;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_patients TO authenticated;

-- 3. Accorder les droits de sélection, d'insertion, de mise à jour et de suppression sur public.sani_patients au rôle de service ;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_patients TO service_role;


-- ---------------------------------------------------------------------------
-- 3. sani_transfers — Transferts SAMU inter-hospitaliers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sani_transfers (
  id              TEXT        PRIMARY KEY,
  patient_id      TEXT        REFERENCES public.sani_patients (id) ON DELETE SET NULL,
  patient_name    TEXT        NOT NULL,
  from_chu        TEXT        NOT NULL,             -- identifiant CHU source
  to_chu          TEXT        NOT NULL,             -- identifiant CHU destination
  chu_name        TEXT,                             -- nom CHU source
  dest_name       TEXT,                             -- nom CHU destination
  reason          TEXT,
  priority        TEXT,                             -- 'P1' | 'P2' | 'P3'
  priority_class  TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending',  -- 'pending' | 'in_transit' | 'arrived' | 'cancelled'
  notes           TEXT,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transfers_from ON public.sani_transfers (from_chu);
CREATE INDEX IF NOT EXISTS idx_transfers_to   ON public.sani_transfers (to_chu);
CREATE INDEX IF NOT EXISTS idx_transfers_ts   ON public.sani_transfers (timestamp DESC);

-- Autorisations sani_transfers :
-- 1. Sélectionner l'octroi sur public.sani_transfers à anonyme ;
GRANT SELECT ON public.sani_transfers TO anon;

-- 2. Accorder les droits de sélection, d'insertion, de mise à jour et de suppression sur public.sani_transfers à authentifié ;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_transfers TO authenticated;

-- 3. Accorder les droits de sélection, d'insertion, de mise à jour et de suppression sur public.sani_transfers au rôle de service ;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_transfers TO service_role;


-- ---------------------------------------------------------------------------
-- 4. sani_prescriptions — Ordonnances électroniques
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sani_prescriptions (
  id             TEXT        PRIMARY KEY,
  patient_id     TEXT        REFERENCES public.sani_patients (id) ON DELETE SET NULL,
  patient_name   TEXT        NOT NULL,
  chu_key        TEXT        NOT NULL,             -- identifiant CHU prescripteur
  chu_name       TEXT,
  doctor         TEXT,
  onmg           TEXT,                             -- N° Ordre National des Médecins du Gabon
  service        TEXT,
  insurance_key  TEXT,                             -- ex: CNAMGS_FONC, CNAMGS_PVNR
  insurance_name TEXT,
  weight         NUMERIC,
  is_ald         BOOLEAN     DEFAULT FALSE,        -- Affection Longue Durée
  medications    JSONB       NOT NULL DEFAULT '[]',-- liste des médicaments prescrits
  notes          TEXT,
  date_text      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.sani_prescriptions (patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_chu     ON public.sani_prescriptions (chu_key);

-- Autorisations sani_prescriptions :
-- 1. Sélectionner l'octroi sur public.sani_prescriptions à anonyme ;
GRANT SELECT ON public.sani_prescriptions TO anon;

-- 2. Accorder les droits de sélection, d'insertion, de mise à jour et de suppression sur public.sani_prescriptions à authentifié ;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_prescriptions TO authenticated;

-- 3. Accorder les droits de sélection, d'insertion, de mise à jour et de suppression sur public.sani_prescriptions au rôle de service ;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_prescriptions TO service_role;


-- ---------------------------------------------------------------------------
-- 5. sani_tele_expertise — Sessions de télé-expertise / RCP
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sani_tele_expertise (
  id              TEXT        PRIMARY KEY,
  title           TEXT,
  patient_id      TEXT        REFERENCES public.sani_patients (id) ON DELETE SET NULL,
  patient_name    TEXT        NOT NULL,
  from_chu        TEXT        NOT NULL,
  to_chu          TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'En attente',
  status_class    TEXT,
  urgency         TEXT        NOT NULL DEFAULT 'Normale',
  date            TEXT,
  notes           TEXT,
  history         JSONB       NOT NULL DEFAULT '[]',
  requested_by    TEXT,
  request_type    TEXT,
  specialty       TEXT,
  question        TEXT,
  response        TEXT,
  response_doctor TEXT,
  response_date   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tele_from_chu ON public.sani_tele_expertise (from_chu);
CREATE INDEX IF NOT EXISTS idx_tele_to_chu   ON public.sani_tele_expertise (to_chu);
CREATE INDEX IF NOT EXISTS idx_tele_status   ON public.sani_tele_expertise (status);

-- Autorisations sani_tele_expertise :
-- 1. Sélectionner l'octroi sur public.sani_tele_expertise à anonyme ;
GRANT SELECT ON public.sani_tele_expertise TO anon;

-- 2. Accorder les droits de sélection, d'insertion, de mise à jour et de suppression sur public.sani_tele_expertise à authentifié ;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_tele_expertise TO authenticated;

-- 3. Accorder les droits de sélection, d'insertion, de mise à jour et de suppression sur public.sani_tele_expertise au rôle de service ;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_tele_expertise TO service_role;


-- ---------------------------------------------------------------------------
-- 6. sani_blood_stocks — Stocks sanguins par CHU (format JSON groupé CNTS)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sani_blood_stocks (
  chu_id     TEXT        PRIMARY KEY,
  stocks     JSONB       NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blood_chu ON public.sani_blood_stocks (chu_id);

-- Autorisations sani_blood_stocks :
-- 1. Sélectionner l'octroi sur public.sani_blood_stocks à anonyme ;
GRANT SELECT ON public.sani_blood_stocks TO anon;

-- 2. Accorder les droits de sélection, d'insertion, de mise à jour et de suppression sur public.sani_blood_stocks à authentifié ;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_blood_stocks TO authenticated;

-- 3. Accorder les droits de sélection, d'insertion, de mise à jour et de suppression sur public.sani_blood_stocks au rôle de service ;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_blood_stocks TO service_role;


-- ---------------------------------------------------------------------------
-- 7. sani_cnts_requisitions — Réquisitions de sang au CNTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sani_cnts_requisitions (
  id           TEXT        PRIMARY KEY,
  chu_id       TEXT        NOT NULL,
  patient_id   TEXT        REFERENCES public.sani_patients (id) ON DELETE SET NULL,
  patient_name TEXT,
  blood_type   TEXT        NOT NULL,
  urgency      TEXT        NOT NULL DEFAULT 'Normale',
  quantity     INTEGER     NOT NULL DEFAULT 1,
  indication   TEXT,
  date         TEXT,
  time         TEXT,
  qr_data      TEXT,
  doctor       TEXT,
  onmg         TEXT,
  service      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cnts_chu    ON public.sani_cnts_requisitions (chu_id);
CREATE INDEX IF NOT EXISTS idx_cnts_patient ON public.sani_cnts_requisitions (patient_id);

-- Autorisations sani_cnts_requisitions :
-- 1. Sélectionner l'octroi sur public.sani_cnts_requisitions à anonyme ;
GRANT SELECT ON public.sani_cnts_requisitions TO anon;

-- 2. Accorder les droits de sélection, d'insertion, de mise à jour et de suppression sur public.sani_cnts_requisitions à authentifié ;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_cnts_requisitions TO authenticated;

-- 3. Accorder les droits de sélection, d'insertion, de mise à jour et de suppression sur public.sani_cnts_requisitions au rôle de service ;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_cnts_requisitions TO service_role;


-- ---------------------------------------------------------------------------
-- 8. sani_bed_logs — Journal d'audit des mouvements de lits
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sani_bed_logs (
  id            BIGSERIAL   PRIMARY KEY,
  chu_id        TEXT        NOT NULL,
  chu_name      TEXT,
  action        TEXT        NOT NULL,  -- 'admission' | 'discharge' | 'transfer_in' | 'transfer_out' | 'adjustment'
  patient_id    TEXT,
  patient_name  TEXT,
  beds_before   INTEGER,
  beds_after    INTEGER,
  delta         INTEGER,               -- positif = occupation ↑, négatif = occupation ↓
  operator      TEXT,                  -- identifiant du poste / utilisateur
  notes         TEXT,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bedlogs_chu ON public.sani_bed_logs (chu_id);
CREATE INDEX IF NOT EXISTS idx_bedlogs_ts  ON public.sani_bed_logs (timestamp DESC);

-- Autorisations sani_bed_logs :
-- 1. Sélectionner l'octroi sur public.sani_bed_logs à anonyme ;
GRANT SELECT ON public.sani_bed_logs TO anon;

-- 2. Accorder les droits de sélection, d'insertion, de mise à jour et de suppression sur public.sani_bed_logs à authentifié ;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_bed_logs TO authenticated;

-- 3. Accorder les droits de sélection, d'insertion, de mise à jour et de suppression sur public.sani_bed_logs au rôle de service ;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_bed_logs TO service_role;

GRANT USAGE, SELECT ON SEQUENCE public.sani_bed_logs_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.sani_bed_logs_id_seq TO service_role;


-- ---------------------------------------------------------------------------
-- 9. sani_epidemic_alerts — Alertes épidémiques (DGS / OMS)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sani_epidemic_alerts (
  id          TEXT        PRIMARY KEY,
  disease     TEXT        NOT NULL,              -- ex: 'Ebola', 'Mpox'
  zone        TEXT        NOT NULL,              -- province ou localité
  level       TEXT        NOT NULL DEFAULT 'watch',  -- 'watch' | 'warning' | 'critical'
  cases       INTEGER     NOT NULL DEFAULT 0,
  deaths      INTEGER     NOT NULL DEFAULT 0,
  description TEXT,
  source      TEXT,                              -- ex: 'DGS Gabon', 'OMS'
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_epidemic_active ON public.sani_epidemic_alerts (active);
CREATE INDEX IF NOT EXISTS idx_epidemic_level  ON public.sani_epidemic_alerts (level);

-- Autorisations sani_epidemic_alerts :
-- 1. Sélectionner l'octroi sur public.sani_epidemic_alerts à anonyme ;
GRANT SELECT ON public.sani_epidemic_alerts TO anon;

-- 2. Accorder les droits de sélection, d'insertion, de mise à jour et de suppression sur public.sani_epidemic_alerts à authentifié ;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_epidemic_alerts TO authenticated;

-- 3. Accorder les droits de sélection, d'insertion, de mise à jour et de suppression sur public.sani_epidemic_alerts au rôle de service ;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_epidemic_alerts TO service_role;


-- ---------------------------------------------------------------------------
-- 10. sani_staff — Annuaire & Authentification du Personnel Hospitalier
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sani_staff (
  id              TEXT        PRIMARY KEY,
  matricule       TEXT        UNIQUE,
  name            TEXT        NOT NULL,
  normalized_name TEXT        NOT NULL,
  role            TEXT        NOT NULL,
  gender          TEXT        NOT NULL DEFAULT 'M',
  title_label     TEXT        NOT NULL,
  hospital_id     TEXT        NOT NULL,
  hospital_name   TEXT        NOT NULL,
  service         TEXT,
  pin_code        TEXT        NOT NULL DEFAULT '1234',
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  avatar          TEXT        DEFAULT '👨‍⚕️',
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_norm_name ON public.sani_staff (normalized_name);
CREATE INDEX IF NOT EXISTS idx_staff_hospital  ON public.sani_staff (hospital_id);

-- Autorisations sani_staff :
-- 1. Sélectionner l'octroi sur public.sani_staff à anonyme ;
GRANT SELECT ON public.sani_staff TO anon;

-- 2. Accorder les droits de sélection, d'insertion, de mise à jour et de suppression sur public.sani_staff à authentifié ;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_staff TO authenticated;

-- 3. Accorder les droits de sélection, d'insertion, de mise à jour et de suppression sur public.sani_staff au rôle de service ;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_staff TO service_role;


-- =============================================================================
-- FIN DE LA MIGRATION
-- =============================================================================
