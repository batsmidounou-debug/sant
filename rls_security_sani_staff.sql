-- =============================================================================
-- GAB-SANTE — Sécurisation RLS & Protection des Données Personnelles
-- Table : public.sani_staff
-- Base  : Supabase (PostgreSQL)
--
-- OBJECTIFS :
-- 1. Activer le Row Level Security (RLS) sur sani_staff.
-- 2. Interdire strictement les requêtes INSERT, UPDATE, DELETE au rôle anon.
-- 3. Masquer la colonne sensible 'pin_code' aux utilisateurs anonymes.
-- 4. Fournir une fonction serveur sécurisée (RPC) pour l'authentification
--    sans JAMAIS renvoyer les mots de passe au navigateur.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Activation de Row Level Security (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.sani_staff ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2. Révocation des droits d'écriture pour le rôle 'anon'
-- -----------------------------------------------------------------------------
-- Le rôle public 'anon' ne peut PLUS insérer, modifier ou supprimer d'agents.
REVOKE INSERT, UPDATE, DELETE ON public.sani_staff FROM anon;

-- -----------------------------------------------------------------------------
-- 3. Révocation de l'accès direct en lecture à la colonne sensible 'pin_code'
-- -----------------------------------------------------------------------------
REVOKE SELECT ON public.sani_staff FROM anon;

-- On autorise 'anon' à lire UNIQUEMENT les colonnes publiques nécessaires à l'annuaire
GRANT SELECT (
  id,
  matricule,
  name,
  normalized_name,
  role,
  gender,
  title_label,
  hospital_id,
  hospital_name,
  service,
  is_active,
  avatar,
  last_login,
  created_at
) ON public.sani_staff TO anon;

-- Les rôles authentifiés et service_role conservent leurs accès complets
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_staff TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sani_staff TO service_role;

-- -----------------------------------------------------------------------------
-- 4. Politiques RLS (Row Level Security Policies)
-- -----------------------------------------------------------------------------
-- Supprimer les anciennes politiques si existantes
DROP POLICY IF EXISTS "Lecture publique annuaire soignants actifs" ON public.sani_staff;
DROP POLICY IF EXISTS "Modification interdite pour anon" ON public.sani_staff;

-- Politique de lecture : tout le monde peut voir l'annuaire des agents actifs (hors pin_code)
CREATE POLICY "Lecture publique annuaire soignants actifs"
  ON public.sani_staff
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- -----------------------------------------------------------------------------
-- 5. Vue publique sécurisée pour l'annuaire hospitalier
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.sani_staff_public AS
  SELECT
    id,
    matricule,
    name,
    normalized_name,
    role,
    gender,
    title_label,
    hospital_id,
    hospital_name,
    service,
    is_active,
    avatar,
    last_login
  FROM public.sani_staff
  WHERE is_active = true;

GRANT SELECT ON public.sani_staff_public TO anon;
GRANT SELECT ON public.sani_staff_public TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. Fonction RPC sécurisée : Authentification d'un agent
-- Cette fonction s'exécute côté PostgreSQL avec les privilèges 'SECURITY DEFINER'.
-- Elle compare le mot de passe sur le serveur sans JAMAIS l'exposer au client.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_staff_login(
  p_identifier TEXT,
  p_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff RECORD;
  v_clean_query TEXT;
BEGIN
  -- Nettoyage de la saisie
  v_clean_query := TRIM(LOWER(p_identifier));

  -- Recherche par matricule OU par nom
  SELECT *
  INTO v_staff
  FROM public.sani_staff
  WHERE (LOWER(matricule) = v_clean_query OR LOWER(name) ILIKE '%' || v_clean_query || '%' OR LOWER(normalized_name) = v_clean_query)
  LIMIT 1;

  -- 1. Agent introuvable
  IF v_staff IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'AGENT_NOT_FOUND',
      'error', 'Agent introuvable dans la base hospitalière (sani_staff).'
    );
  END IF;

  -- 2. Compte désactivé
  IF v_staff.is_active = false THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ACCOUNT_DISABLED',
      'error', 'Ce compte soignant est désactivé. Veuillez contacter l''administrateur.'
    );
  END IF;

  -- 3. Vérification du mot de passe
  IF v_staff.pin_code <> p_pin THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_PIN',
      'error', 'Mot de passe ou code d''accès incorrect.'
    );
  END IF;

  -- 4. Succès : mise à jour de last_login côté serveur
  UPDATE public.sani_staff
  SET last_login = now()
  WHERE id = v_staff.id;

  -- 5. Retour du profil (SANS le champ pin_code)
  RETURN jsonb_build_object(
    'success', true,
    'agent', jsonb_build_object(
      'id', v_staff.id,
      'matricule', v_staff.matricule,
      'name', v_staff.name,
      'role', v_staff.role,
      'gender', v_staff.gender,
      'title_label', v_staff.title_label,
      'hospital_id', v_staff.hospital_id,
      'hospital_name', v_staff.hospital_name,
      'service', v_staff.service,
      'avatar', v_staff.avatar,
      'last_login', now()
    )
  );
END;
$$;

-- Autoriser le rôle anon à appeler cette fonction RPC
GRANT EXECUTE ON FUNCTION public.verify_staff_login(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_staff_login(TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. Fonction RPC sécurisée : Modification du mot de passe par l'agent
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.change_staff_password(
  p_agent_id TEXT,
  p_old_pin TEXT,
  p_new_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_pin TEXT;
BEGIN
  IF LENGTH(p_new_pin) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Le nouveau mot de passe doit comporter au moins 6 caractères.');
  END IF;

  SELECT pin_code INTO v_current_pin
  FROM public.sani_staff
  WHERE id = p_agent_id;

  IF v_current_pin IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Agent non trouvé.');
  END IF;

  IF v_current_pin <> p_old_pin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Mot de passe actuel incorrect.');
  END IF;

  UPDATE public.sani_staff
  SET pin_code = p_new_pin
  WHERE id = p_agent_id;

  RETURN jsonb_build_object('success', true, 'message', 'Mot de passe mis à jour avec succès.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.change_staff_password(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.change_staff_password(TEXT, TEXT, TEXT) TO authenticated;
