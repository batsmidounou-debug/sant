/**
 * GAB-SANTE - Système d'Authentification Sécurisée & Annuaire Hospitalier Supabase
 * Module : auth.js
 *
 * RÈGLE STRICTE :
 * La session NE PEUT S'OUVRIR QUE si le nom de l'agent soignant existe déjà
 * dans la table 'sani_staff' de la base de données Supabase et est validé/authentifié.
 *
 * Si le nom n'est pas trouvé dans la base de données :
 * -> ACCÈS STRICTEMENT REFUSÉ, la session reste verrouillée.
 *
 * Dès que l'authentification réussit :
 * -> Message d'accueil personnalisé :
 *    "Bonjour et bienvenue Docteur [Nom] !"
 *    "Bonjour et bienvenue Infirmière [Nom] !"
 *    "Bonjour et bienvenue Sage-femme [Nom] !"
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'sani_auth_agent_session';
  const SUPABASE_REST_URL = 'https://bxvuvagcstsemxmlykyx.supabase.co/rest/v1/sani_staff';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4dnV2YWdjc3RzZW14bWx5a3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MTk2NzAsImV4cCI6MjEwNzQ5NTY3MH0.KDS3wMAPTaRY-9QSn0yRuMFmZCZGlq0PRJH2PlhEKIs';

  // Annuaire de secours local aligné avec la base de données
  const FALLBACK_STAFF = [
    {
      id: 'STF-CHUL-001',
      matricule: 'MS-GA-48901',
      name: 'Dr. Eric Baye',
      role: 'medecin',
      gender: 'M',
      title_label: 'Docteur',
      hospital_id: 'chul',
      hospital_name: 'CHU de Libreville (CHUL)',
      service: 'Pôle Général & Urgences Polyvalentes',
      pin_code: 'Baye@2026',
      avatar: ''
    },
    {
      id: 'STF-CHUO-002',
      matricule: 'MS-GA-52104',
      name: 'Dr. Elise Ondo',
      role: 'medecin',
      gender: 'F',
      title_label: 'Docteur',
      hospital_id: 'chuo',
      hospital_name: "CHU d'Owendo (CHUO)",
      service: 'Chirurgie Orthopédique & Traumatologie',
      pin_code: 'Ondo@chuo',
      avatar: ''
    },
    {
      id: 'STF-CHUMEF-003',
      matricule: 'MS-GA-38012',
      name: 'Pr. Solange Ntsame',
      role: 'medecin',
      gender: 'F',
      title_label: 'Docteur',
      hospital_id: 'chumef',
      hospital_name: 'CHU Mère-Enfant Jeanne Ebori (CHUMEF)',
      service: 'Gynécologie, Obstétrique & Néonatalogie',
      pin_code: '1234',
      avatar: ''
    },
    {
      id: 'STF-CHRF-004',
      matricule: 'MS-GA-61099',
      name: 'Pr. Guy Nguema',
      role: 'medecin',
      gender: 'M',
      title_label: 'Docteur',
      hospital_id: 'chrf',
      hospital_name: 'CHR Amissa Bongo de Franceville (CHRF)',
      service: 'Infectiologie & Médecine Interne',
      pin_code: '1234',
      avatar: ''
    },
    {
      id: 'STF-HASL-005',
      matricule: 'MS-GA-55410',
      name: 'Dr. Jean-Claude Mouloungui',
      role: 'medecin',
      gender: 'M',
      title_label: 'Docteur',
      hospital_id: 'hasl',
      hospital_name: 'Hôpital Albert Schweitzer (HASL Lambaréné)',
      service: 'Recherche Clinique & Médecine Tropicale',
      pin_code: '1234',
      avatar: ''
    },
    {
      id: 'STF-SAMU-006',
      matricule: 'MS-GA-77123',
      name: 'Dr. Patrick Nziengui',
      role: 'samu',
      gender: 'M',
      title_label: 'Docteur Régulateur SAMU',
      hospital_id: 'chul',
      hospital_name: 'Centre National Régulation SAMU 1300',
      service: 'Régulation SAMU 1300',
      pin_code: '1234',
      avatar: ''
    },
    {
      id: 'STF-CHUL-007',
      matricule: 'INF-GA-89201',
      name: 'Clarisse Mboumba',
      role: 'infirmiere',
      gender: 'F',
      title_label: 'Infirmière',
      hospital_id: 'chul',
      hospital_name: 'CHU de Libreville (CHUL)',
      service: 'Soins Intensifs & Réanimation Adulte',
      pin_code: 'Mboumba#241',
      avatar: ''
    },
    {
      id: 'STF-CHUO-008',
      matricule: 'INF-GA-91402',
      name: 'Patrick Ondo',
      role: 'infirmiere',
      gender: 'M',
      title_label: 'Infirmier',
      hospital_id: 'chuo',
      hospital_name: "CHU d'Owendo (CHUO)",
      service: 'Anesthésie & Urgences Traumatologiques',
      pin_code: '1234',
      avatar: ''
    },
    {
      id: 'STF-CHUMEF-009',
      matricule: 'INF-GA-88310',
      name: 'Blandine Avome',
      role: 'infirmiere',
      gender: 'F',
      title_label: 'Infirmière',
      hospital_id: 'chumef',
      hospital_name: 'CHU Mère-Enfant Jeanne Ebori (CHUMEF)',
      service: 'Pédiatrie & Soins Néonataux',
      pin_code: '1234',
      avatar: ''
    },
    {
      id: 'STF-CHUMEF-010',
      matricule: 'SF-GA-34190',
      name: 'Marie-Noëlle Ntsame',
      role: 'sage_femme',
      gender: 'F',
      title_label: 'Sage-femme',
      hospital_id: 'chumef',
      hospital_name: 'CHU Mère-Enfant Jeanne Ebori (CHUMEF)',
      service: "Bloc Obstétrical & Salle d'Accouchement",
      pin_code: 'Ntsame2026',
      avatar: ''
    },
    {
      id: 'STF-CHRPOG-011',
      matricule: 'SF-GA-45012',
      name: 'Jeanne Biyoghe',
      role: 'sage_femme',
      gender: 'F',
      title_label: 'Sage-femme',
      hospital_id: 'chrpog',
      hospital_name: 'CHR de Port-Gentil (CHRPOG)',
      service: 'Maternité Provinciale',
      pin_code: '1234',
      avatar: ''
    },
    {
      id: 'STF-CHUA-012',
      matricule: 'PH-GA-67290',
      name: 'Dr. Paul Mouelet',
      role: 'pharmacien',
      gender: 'M',
      title_label: 'Docteur Pharmacien',
      hospital_id: 'chua',
      hospital_name: "CHU d'Angondjé (CHUA)",
      service: 'Pharmacie Hospitalière & Médicaments Essentiels',
      pin_code: '1234',
      avatar: ''
    }
  ];

  class AuthService {
    constructor() {
      this.currentAgent = null;
      this.databaseStaff = [];
      this.isDbLoaded = false;
      this.init();
    }

    async init() {
      // 1. Récupérer la session stockée si existante
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          this.currentAgent = JSON.parse(saved);
          if (this.currentAgent) {
            this.currentAgent.name = this.cleanAgentName(this.currentAgent.name);
            this.currentAgent.avatar = '';
            if (this.currentAgent.isAdmin === undefined) {
              this.currentAgent.isAdmin = this.currentAgent.role === 'medecin';
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentAgent));
          }
        } catch (e) {
          this.currentAgent = null;
        }
      }

      // 2. Charger les soignants autorisés depuis la table Supabase sani_staff
      await this.loadStaffFromDatabase();

      // 3. Monter l'interface
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setupUI());
      } else {
        this.setupUI();
      }
    }

    /**
     * Charge l'annuaire des soignants directement depuis la table Supabase 'sani_staff'
     */
    async loadStaffFromDatabase() {
      try {
        const response = await fetch(`${SUPABASE_REST_URL}?select=*&order=name.asc`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            this.databaseStaff = data.map(s => {
              s.name = this.cleanAgentName(s.name);
              s.avatar = '';
              return s;
            });
            this.isDbLoaded = true;
            console.log(`[GAB-SANTE Auth] ${data.length} soignants chargés depuis Supabase sani_staff.`);
          } else {
            this.databaseStaff = FALLBACK_STAFF;
          }
        } else {
          this.databaseStaff = FALLBACK_STAFF;
        }
      } catch (err) {
        console.warn('[GAB-SANTE Auth] Connexion directe Supabase impossible, utilisation annuaire local :', err);
        this.databaseStaff = FALLBACK_STAFF;
      }
    }

    setupUI() {
      this.injectAuthElements();
      this.updateTopbarUserBadge();
      this.updateSidebarSessionWidget();

      // Si aucun utilisateur n'est authentifié, afficher l'écran de verrouillage
      if (!this.currentAgent) {
        const isUrlAdmin = window.location.search.includes('admin') || window.location.hash.includes('admin');
        if (isUrlAdmin) {
          this.showAdminPortal();
        } else {
          this.showAgentPortal();
        }
      } else {
        this.syncHospitalWithApp(this.currentAgent.hospitalId || this.currentAgent.hospital_id);
      }
    }

    /**
     * Nettoie et retire tout emoji, mojibake (ex: ðŸ©º, 🩺) ou préfixe parasite du nom d'agent
     */
    cleanAgentName(name) {
      if (!name) return '';
      return String(name)
        .replace(/ðŸ©º/g, '')
        .replace(/🩺/g, '')
        .replace(/[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .replace(/[ðŸ\u00A9\u00BA]/g, '')
        .replace(/^\s*[-•:–]\s*/, '')
        .trim();
    }

    /**
     * Normalise une chaîne pour une comparaison de nom robuste et tolérante
     */
    normalize(str) {
      if (!str) return '';
      return String(str)
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // supprime les accents pour le matching
        .replace(/\b(dr|docteur|pr|professeur|mme|madame|m|monsieur)\b\.?/gi, '') // retire les titres
        .replace(/[^a-z0-9]/gi, '') // garde uniquement alphanum
        .trim();
    }

    /**
     * Recherche un agent dans la base de données par son nom ou son matricule
     */
    findAgentInDatabase(queryName) {
      if (!queryName) return null;
      const qNorm = this.normalize(queryName);
      if (!qNorm) return null;

      // 1. Recherche par matricule exact
      const byMatricule = this.databaseStaff.find(s => 
        s.matricule && this.normalize(s.matricule) === qNorm
      );
      if (byMatricule) return byMatricule;

      // 2. Recherche par nom exact normalisé
      const exactMatch = this.databaseStaff.find(s => 
        this.normalize(s.name) === qNorm || this.normalize(s.normalized_name) === qNorm
      );
      if (exactMatch) return exactMatch;

      // 3. Recherche par inclusion (si le nom tapé contient le nom en base ou inversement)
      const partialMatch = this.databaseStaff.find(s => {
        const sNorm = this.normalize(s.name);
        return (sNorm.length > 3 && qNorm.includes(sNorm)) || (qNorm.length > 3 && sNorm.includes(qNorm));
      });

      return partialMatch || null;
    }

    /**
     * Détermine la formule de politesse exacte selon le profil
     */
    getGreetingMessage(agent) {
      const role = agent.role;
      const gender = agent.gender || 'M';
      let title = 'Docteur';

      if (role === 'medecin') {
        title = 'Docteur';
      } else if (role === 'infirmiere') {
        title = (gender === 'M') ? 'Infirmier' : 'Infirmière';
      } else if (role === 'sage_femme') {
        title = 'Sage-femme';
      } else if (role === 'pharmacien') {
        title = 'Docteur Pharmacien';
      } else if (role === 'samu') {
        title = 'Docteur Régulateur SAMU';
      } else if (role === 'aide_soignant') {
        title = (gender === 'M') ? 'Aide-soignant' : 'Aide-soignante';
      } else {
        title = agent.title_label || agent.titleLabel || 'Soignant';
      }

      return `Bonjour et bienvenue ${title} ${this.cleanAgentName(agent.name)} !`;
    }

    /**
     * TENTATIVE DE CONNEXION AVEC VÉRIFICATION STRICTE EN BASE DE DONNÉES
     */
    async attemptLogin(inputName, inputPin) {
      this.clearError();

      const nameToSearch = (inputName || '').trim();
      if (!nameToSearch) {
        this.showError("Veuillez saisir votre nom d'agent hospitalier ou votre matricule.");
        return false;
      }

      // Recharger la base si nécessaire
      if (!this.databaseStaff.length) {
        await this.loadStaffFromDatabase();
      }

      // VÉRIFICATION D'EXISTENCE DANS LA BASE DE DONNÉES
      const matchedAgent = this.findAgentInDatabase(nameToSearch);

      if (!matchedAgent) {
        // Enregistrer la tentative infructueuse dans le journal d'audit
        this.recordLoginEvent({ id: 'INCONNU', name: nameToSearch, role: 'soignant', matricule: 'N/A' }, 'FAILED', 'Matricule ou agent non trouvé en base');
        // REFUS TOTAL : Le nom n'existe pas dans la base de données
        this.showError(`❌ Accès refusé : L'agent « ${this.escapeHtml(nameToSearch)} » n'existe pas dans la base de données du personnel hospitalier (table sani_staff). La session ne peut pas être ouverte.`);
        return false;
      }

      // VÉRIFICATION DU STATUT ACTIF
      if (matchedAgent.is_active === false) {
        this.recordLoginEvent(matchedAgent, 'BLOCKED', 'Compte agent désactivé par la direction');
        this.showError(`❌ Accès refusé : Le compte de « ${this.escapeHtml(matchedAgent.name)} » est désactivé dans la base de données. Contactez l'administrateur.`);
        return false;
      }

      // VÉRIFICATION DU MOT DE PASSE ATTRIBUÉ À L'AGENT EN BASE DE DONNÉES
      const expectedPin = String(matchedAgent.pin_code || '1234');
      const enteredPin = String(inputPin || '').trim();

      if (!enteredPin) {
        this.showError(`Veuillez renseigner le mot de passe pour « ${this.escapeHtml(matchedAgent.name)} ».`);
        return false;
      }

      if (enteredPin !== expectedPin) {
        this.recordLoginEvent(matchedAgent, 'FAILED', 'Mot de passe erroné');
        this.showError(`❌ Mot de passe incorrect pour « ${this.escapeHtml(matchedAgent.name)} ». Veuillez vérifier votre saisie (cliquez sur l'œil 👁️ pour voir le mot de passe tapé).`);
        return false;
      }

      // AUTHENTIFICATION RÉUSSIE : L'agent existe bien dans la base de données
      const cleanName = this.cleanAgentName(matchedAgent.name);
      const sessionAgent = {
        id: matchedAgent.id,
        matricule: matchedAgent.matricule,
        name: cleanName,
        role: matchedAgent.role,
        gender: matchedAgent.gender || 'M',
        titleLabel: matchedAgent.title_label || (matchedAgent.role === 'medecin' ? 'Docteur' : (matchedAgent.role === 'sage_femme' ? 'Sage-femme' : 'Infirmière')),
        hospitalId: matchedAgent.hospital_id,
        hospitalName: matchedAgent.hospital_name || 'Établissement Hospitalier',
        service: matchedAgent.service,
        avatar: '',
        authenticatedAt: new Date().toISOString(),
        // Les médecins ont accès au panneau d'administration du personnel
        isAdmin: matchedAgent.is_admin === true || matchedAgent.role === 'medecin'
      };

      this.currentAgent = sessionAgent;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionAgent));

      // Enregistrer l'événement de connexion réussie dans le journal d'audit
      this.recordLoginEvent(matchedAgent, 'SUCCESS', 'Connexion soignant réussie et validée');

      // Mettre à jour last_login dans Supabase
      this.updateLastLogin(matchedAgent.id);

      // Supprimer immédiatement tout toast ou message d'erreur restant
      this.clearError();
      if (window.saniApp && typeof window.saniApp.clearAllToasts === 'function') {
        window.saniApp.clearAllToasts();
      }

      // Aligner la structure hospitalière active dans l'interface sans déclencher de toast intempestif
      this.syncHospitalWithApp(sessionAgent.hospitalId);

      // Vider les champs pour ne rien laisser en mémoire
      this.clearInputs();

      // Fermer le portail de connexion
      this.hideLoginPortal();

      // Mettre à jour les badges soignant dans la barre supérieure et la barre latérale
      this.updateTopbarUserBadge();
      this.updateSidebarSessionWidget();

      // Afficher le message d'accueil personnalisé
      this.showWelcomeBanner(sessionAgent);

      return true;
    }

    /**
     * Enregistre un événement de connexion dans le journal d'audit local
     */
    recordLoginEvent(agent, status = 'SUCCESS', details = '') {
      try {
        const key = 'sani_agent_login_logs';
        let logs = [];
        try {
          const saved = localStorage.getItem(key);
          if (saved) logs = JSON.parse(saved);
        } catch(e) { logs = []; }
        if (!Array.isArray(logs)) logs = [];

        const now = new Date();
        const cleanName = this.cleanAgentName(agent.name || 'Soignant Inconnu');
        const entry = {
          id: 'LOG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          agentId: agent.id || 'N/A',
          agentName: cleanName,
          matricule: agent.matricule || 'N/A',
          role: agent.role || 'soignant',
          titleLabel: agent.title_label || agent.titleLabel || 'Soignant',
          hospitalId: agent.hospital_id || agent.hospitalId || 'CHUL',
          hospitalName: agent.hospital_name || agent.hospitalName || 'Établissement Hospitalier',
          service: agent.service || 'Non spécifié',
          status: status, // 'SUCCESS', 'FAILED', 'BLOCKED'
          details: details,
          timestamp: now.toISOString(),
          displayDate: now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          displayTime: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          device: navigator.userAgent.includes('Windows') ? 'Windows' : (navigator.userAgent.includes('Mac') ? 'macOS' : (navigator.userAgent.includes('Android') ? 'Android' : (navigator.userAgent.includes('iPhone') ? 'iOS' : 'Web Browser'))
        };

        logs.unshift(entry);
        if (logs.length > 500) logs = logs.slice(0, 500);
        localStorage.setItem(key, JSON.stringify(logs));
      } catch(e) {
        console.warn('[GAB-SANTE] Erreur enregistrement log connexion:', e);
      }
    }

    /**
     * Récupère le journal chronologique des connexions
     */
    getLoginLogs() {
      try {
        const saved = localStorage.getItem('sani_agent_login_logs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch(e) {}

      // Si vide, initialiser avec un historique représentatif du réseau hospitalier
      const now = Date.now();
      const initialLogs = [
        {
          id: 'LOG-INIT-001',
          agentId: 'STF-CHUL-001',
          agentName: 'Dr. Eric Baye',
          matricule: 'MS-GA-48901',
          role: 'medecin',
          titleLabel: 'Docteur',
          hospitalId: 'chul',
          hospitalName: 'CHU de Libreville (CHUL)',
          service: 'Pôle Général & Urgences Polyvalentes',
          status: 'SUCCESS',
          details: 'Session médicale active - Consultation DMP',
          timestamp: new Date(now - 1000 * 60 * 18).toISOString(),
          displayDate: new Date(now - 1000 * 60 * 18).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          displayTime: new Date(now - 1000 * 60 * 18).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          device: 'Poste Médical CHUL (Windows)'
        },
        {
          id: 'LOG-INIT-002',
          agentId: 'STF-CHUL-007',
          agentName: 'Clarisse Mboumba',
          matricule: 'INF-GA-89201',
          role: 'infirmiere',
          titleLabel: 'Infirmière',
          hospitalId: 'chul',
          hospitalName: 'CHU de Libreville (CHUL)',
          service: 'Soins Intensifs & Réanimation Adulte',
          status: 'SUCCESS',
          details: 'Transmission soignante & constantes DMP',
          timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
          displayDate: new Date(now - 1000 * 60 * 45).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          displayTime: new Date(now - 1000 * 60 * 45).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          device: 'Tablette Soins Réa (Android)'
        },
        {
          id: 'LOG-INIT-003',
          agentId: 'STF-CHUMEF-010',
          agentName: 'Marie-Noëlle Ntsame',
          matricule: 'SF-GA-34190',
          role: 'sage_femme',
          titleLabel: 'Sage-femme',
          hospitalId: 'chumef',
          hospitalName: 'CHU Mère-Enfant Jeanne Ebori (CHUMEF)',
          service: "Bloc Obstétrical & Salle d'Accouchement",
          status: 'SUCCESS',
          details: 'Admission maternité & fiche navette',
          timestamp: new Date(now - 1000 * 60 * 110).toISOString(),
          displayDate: new Date(now - 1000 * 60 * 110).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          displayTime: new Date(now - 1000 * 60 * 110).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          device: 'Poste Bloc CHUMEF (Windows)'
        },
        {
          id: 'LOG-INIT-004',
          agentId: 'STF-SAMU-006',
          agentName: 'Dr. Patrick Nziengui',
          matricule: 'MS-GA-77123',
          role: 'samu',
          titleLabel: 'Docteur Régulateur SAMU',
          hospitalId: 'chul',
          hospitalName: 'Centre National Régulation SAMU 1300',
          service: 'Régulation SAMU 1300',
          status: 'SUCCESS',
          details: 'Régulation transfert inter-CHU P1',
          timestamp: new Date(now - 1000 * 60 * 180).toISOString(),
          displayDate: new Date(now - 1000 * 60 * 180).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          displayTime: new Date(now - 1000 * 60 * 180).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          device: 'Poste Régulation SAMU 1300'
        }
      ];
      try { localStorage.setItem('sani_agent_login_logs', JSON.stringify(initialLogs)); } catch(e) {}
      return initialLogs;
    }

    /**
     * Met à jour l'horodatage de dernière connexion dans Supabase et en mémoire
     */
    async updateLastLogin(agentId) {
      const nowIso = new Date().toISOString();
      const localAgent = this.databaseStaff.find(s => s.id === agentId);
      if (localAgent) {
        localAgent.last_login = nowIso;
      }
      try {
        await fetch(`${SUPABASE_REST_URL}?id=eq.${agentId}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ last_login: nowIso })
        });
      } catch (e) {
        // Ignorer en mode offline
      }
    }

    logout() {
      if (confirm('Voulez-vous fermer votre session soignant et verrouiller l\'accès à GAB-SANTE ?')) {
        this.currentAgent = null;
        localStorage.removeItem(STORAGE_KEY);
        this.closeWelcomeModal();
        this.clearInputs();
        this.updateTopbarUserBadge();
        this.updateSidebarSessionWidget();
        this.showLoginPortal();
        if (window.saniApp && typeof window.saniApp.showToast === 'function') {
          window.saniApp.showToast('Session verrouillée. Veuillez vous authentifier pour accéder au DMP.');
        }
      }
    }

    syncHospitalWithApp(hospitalId) {
      if (!hospitalId) return;
      const applySync = () => {
        const select = document.getElementById('current-chu-select');
        if (select && select.options && select.options.length > 0) {
          if (select.value !== hospitalId) {
            select.value = hospitalId;
          }
          if (window.saniApp) {
            window.saniApp.currentChu = hospitalId;
            if (typeof window.saniApp.renderCurrentView === 'function') {
              window.saniApp.renderCurrentView();
            }
          }
          return true;
        }
        return false;
      };

      if (!applySync()) {
        setTimeout(applySync, 150);
        setTimeout(applySync, 600);
      }
    }

    showWelcomeBanner(agent) {
      const greeting = this.getGreetingMessage(agent);
      const modal = document.getElementById('auth-welcome-modal');
      const textElem = document.getElementById('auth-welcome-text');
      const subElem = document.getElementById('auth-welcome-sub');
      const avatarElem = document.getElementById('auth-welcome-avatar');

      const serviceName = agent.service || 'Soins Polyvalents';
      const hospName = agent.hospitalName || agent.hospital_name || 'Établissement Hospitalier';
      if (textElem) textElem.textContent = greeting;
      if (subElem) subElem.textContent = `Authentifié(e) · Service : ${serviceName} · ${hospName}`;
      if (avatarElem) avatarElem.textContent = '🏥';

      if (modal) {
        modal.style.display = 'flex';

        // Carillon sonore doux
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // Do 5
          osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // Mi 5
          osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // Sol 5
          gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.45);
        } catch (e) {}

        setTimeout(() => {
          if (modal && modal.style.display === 'flex') {
            modal.style.display = 'none';
          }
        }, 4500);
      }

      // Nettoyage de tout toast pour garantir qu'aucun message d'erreur ou notification superflue n'apparaisse
      if (window.saniApp && typeof window.saniApp.clearAllToasts === 'function') {
        window.saniApp.clearAllToasts();
      }
    }

    closeWelcomeModal() {
      const modal = document.getElementById('auth-welcome-modal');
      if (modal) modal.style.display = 'none';
    }

    showAgentPortal() {
      const overlay = document.getElementById('auth-portal-overlay');
      const cardAgent = document.getElementById('auth-card-agent');
      const cardAdmin = document.getElementById('auth-card-admin');
      if (overlay) {
        overlay.style.display = 'flex';
        document.body.classList.add('auth-locked');
      }
      if (cardAgent) cardAgent.style.display = 'block';
      if (cardAdmin) cardAdmin.style.display = 'none';
      this.clearInputs();
      setTimeout(() => {
        const input = document.getElementById('auth-input-name');
        if (input) input.focus();
      }, 120);
    }

    showAdminPortal() {
      const overlay = document.getElementById('auth-portal-overlay');
      const cardAgent = document.getElementById('auth-card-agent');
      const cardAdmin = document.getElementById('auth-card-admin');
      if (overlay) {
        overlay.style.display = 'flex';
        document.body.classList.add('auth-locked');
      }
      if (cardAgent) cardAgent.style.display = 'none';
      if (cardAdmin) cardAdmin.style.display = 'block';
      this._switchAdminPortalTab('login');
      setTimeout(() => {
        const input = document.getElementById('admin-portal-login');
        if (input) input.focus();
      }, 120);
    }

    showLoginPortal() {
      const isUrlAdmin = window.location.search.includes('admin') || window.location.hash.includes('admin');
      if (isUrlAdmin) {
        this.showAdminPortal();
      } else {
        this.showAgentPortal();
      }
    }

    /**
     * Réinitialise et vide entièrement tous les champs du formulaire de connexion
     */
    clearInputs() {
      const form = document.getElementById('auth-custom-form');
      if (form && typeof form.reset === 'function') {
        form.reset();
      }

      const nameInput = document.getElementById('auth-input-name');
      if (nameInput) {
        nameInput.value = '';
      }

      const pinInput = document.getElementById('auth-input-pin');
      if (pinInput) {
        pinInput.value = '';
        pinInput.type = 'password';
      }

      const eyeIcon = document.getElementById('auth-password-eye-icon');
      if (eyeIcon) {
        eyeIcon.textContent = '👁️';
      }

      const adminLogin = document.getElementById('admin-portal-login');
      if (adminLogin) adminLogin.value = '';
      const adminPwd = document.getElementById('admin-portal-pwd');
      if (adminPwd) adminPwd.value = '';

      this.clearError();
    }

    hideLoginPortal() {
      const overlay = document.getElementById('auth-portal-overlay');
      if (overlay) {
        overlay.style.display = 'none';
        document.body.classList.remove('auth-locked');
      }
    }

    showError(msg) {
      const errBox = document.getElementById('auth-error-box');
      if (errBox) {
        errBox.innerHTML = `<strong>Attention :</strong> ${msg}`;
        errBox.style.display = 'block';
      } else {
        alert(msg);
      }
    }

    clearError() {
      const errBox = document.getElementById('auth-error-box');
      if (errBox) {
        errBox.textContent = '';
        errBox.style.display = 'none';
      }
    }

    updateTopbarUserBadge() {
      let badge = document.getElementById('auth-agent-topbar-badge');
      if (!badge) {
        const topbarActions = document.querySelector('.topbar-actions');
        if (topbarActions) {
          badge = document.createElement('div');
          badge.id = 'auth-agent-topbar-badge';
          badge.className = 'auth-topbar-badge';
          topbarActions.insertBefore(badge, topbarActions.firstChild);
        }
      }

      if (!badge) return;

      if (this.currentAgent) {
        const hospName = this.currentAgent.hospitalName || this.currentAgent.hospital_name || '';
        const match = hospName.match(/\(([^)]+)\)/);
        const hospShort = match ? match[1] : (this.currentAgent.hospitalId ? this.currentAgent.hospitalId.toUpperCase() : 'CHU');
        const cleanName = this.cleanAgentName(this.currentAgent.name);
        const isAdmin = this.currentAgent.isAdmin === true;
        badge.innerHTML = `
          <div class="auth-topbar-user" onclick="${isAdmin ? 'window.AuthService.openConnectionsMonitor()' : 'window.AuthService.showAgentDetails()'}" title="${isAdmin ? 'Ouvrir la surveillance des connexions des agents' : 'Afficher votre fiche soignant'}" style="cursor:pointer;">
            <div class="auth-user-meta">
              <span class="auth-user-name">${isAdmin ? '🛡️ ' : ''}${this.escapeHtml(cleanName)}</span>
              <span class="auth-user-role">${isAdmin ? '<strong style="color:#0284c7;">📊 Surveillance Connexions</strong>' : `${this.escapeHtml(this.currentAgent.titleLabel)} · ${this.escapeHtml(hospShort)}`}</span>
            </div>
          </div>
        `;
        badge.style.display = 'flex';
      } else {
        badge.innerHTML = `
          <button class="btn-primary" onclick="window.AuthService.showAgentPortal()" style="padding: 6px 12px; font-size: 0.82rem; margin-right: 6px;">
            <span>🩺</span> Espace Soignants
          </button>
          <button class="btn-secondary" onclick="window.AuthService.showAdminPortal()" style="padding: 6px 12px; font-size: 0.82rem; background:#0f172a; color:#f8fafc; border:1px solid #334155;">
            <span>🛡️</span> Administration DSI
          </button>
        `;
        badge.style.display = 'flex';
      }
    }

    /**
     * Affiche ou masque le widget de session et le bouton Déconnexion dans la barre latérale
     */
    updateSidebarSessionWidget() {
      let card = document.getElementById('auth-sidebar-session-widget');
      if (!card) {
        const sidebar = document.querySelector('.sidebar');
        const sidebarFooter = document.querySelector('.sidebar-footer');
        if (sidebar) {
          card = document.createElement('div');
          card.id = 'auth-sidebar-session-widget';
          card.className = 'auth-sidebar-session-widget';
          if (sidebarFooter) {
            sidebar.insertBefore(card, sidebarFooter);
          } else {
            sidebar.appendChild(card);
          }
        }
      }

      if (!card) return;

      if (this.currentAgent) {
        const hospName = String(this.currentAgent.hospitalName || this.currentAgent.hospital_name || this.currentAgent.hospitalId || 'CHU');
        const cleanHospName = hospName.replace(/\(.*\)/, '').trim();
        const cleanName = this.cleanAgentName(this.currentAgent.name);
        const isAdmin = this.currentAgent.isAdmin === true;
        card.innerHTML = `
          <div class="auth-sidebar-card-box">
            <div class="auth-sidebar-agent-header">
              <div class="auth-sidebar-meta">
                <span class="auth-sidebar-tag">${isAdmin ? '🛡️ Superviseur Système' : 'Session Soignant Active'}</span>
                <span class="auth-sidebar-name">${this.escapeHtml(cleanName)}</span>
                <span class="auth-sidebar-title">${this.escapeHtml(this.currentAgent.titleLabel)} · ${this.escapeHtml(cleanHospName)}</span>
              </div>
            </div>
            ${isAdmin ? `
            <button type="button" class="btn-sidebar-action" onclick="window.AuthService.openConnectionsMonitor()" title="Surveiller les connexions et accès des soignants" style="background:#eff6ff;color:#0284c7;border:1.5px solid #93c5fd;border-radius:8px;padding:8px 12px;font-size:0.79rem;font-weight:700;cursor:pointer;width:100%;text-align:left;display:flex;align-items:center;gap:7px;margin-bottom:6px;box-shadow:0 1px 3px rgba(2,132,199,0.12);">
              <span>📊</span> Suivi des Connexions
            </button>
            <button type="button" class="btn-sidebar-action" onclick="window.AuthService.openAdminPanel()" title="Gérer le personnel soignant" style="background:#f8fafc;color:#1e293b;border:1px solid #cbd5e1;border-radius:8px;padding:7px 12px;font-size:0.78rem;font-weight:600;cursor:pointer;width:100%;text-align:left;display:flex;align-items:center;gap:6px;margin-bottom:5px;">
              <span>👥</span> Gérer le Personnel
            </button>
            <button type="button" class="btn-sidebar-action" onclick="window.AuthService.openAdminLoginModal()" title="Modifier les identifiants administrateur" style="background:#f8fafc;color:#334155;border:1px solid #cbd5e1;border-radius:8px;padding:7px 12px;font-size:0.78rem;font-weight:600;cursor:pointer;width:100%;text-align:left;display:flex;align-items:center;gap:6px;margin-bottom:5px;">
              <span>🔑</span> Mon Mot de Passe Admin
            </button>
            ` : `
            <button type="button" class="btn-sidebar-action" onclick="window.AuthService.openChangePasswordModal()" title="Modifier votre mot de passe de service" style="background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;border-radius:8px;padding:7px 12px;font-size:0.78rem;font-weight:600;cursor:pointer;width:100%;text-align:left;display:flex;align-items:center;gap:6px;margin-bottom:5px;">
              <span>🔑</span> Changer mon mot de passe
            </button>
            `}
            <button type="button" class="btn-sidebar-logout" onclick="window.AuthService.logout()" title="Fermer votre session hospitalière">
              <span>🚪</span> Déconnexion
            </button>
          </div>
        `;
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    }

    showAgentDetails() {
      if (!this.currentAgent) return;
      alert(`FICHE DE L'AGENT AUTHENTIFIÉ :
• Identifiant : ${this.currentAgent.id} (Matricule : ${this.currentAgent.matricule || 'N/A'})
• Nom : ${this.cleanAgentName(this.currentAgent.name)}
• Titre : ${this.currentAgent.titleLabel} (${this.currentAgent.role})
• Structure : ${this.currentAgent.hospitalName}
• Service : ${this.currentAgent.service}
• Statut : Vérifié et authentifié en base de données (sani_staff)
• Session active depuis : ${new Date(this.currentAgent.authenticatedAt).toLocaleTimeString()}`);
    }

    injectAuthElements() {
      if (document.getElementById('auth-portal-overlay')) return;

      const authContainer = document.createElement('div');
      authContainer.id = 'auth-dom-components';
      authContainer.innerHTML = `
        <!-- OVERLAY PORTAIL DE CONNEXION AVEC DOUBLE ESPACE SÉPARÉ (SOIGNANTS / ADMIN) -->
        <div id="auth-portal-overlay" class="auth-portal-overlay" style="display: none;">
          <div class="auth-portal-wrapper animate-scale-up">
            
            <!-- ============================================================ -->
            <!-- 1. PORTAIL OFFICIEL DES PROFESSIONNELS DE SANTÉ              -->
            <!-- ============================================================ -->
            <div id="auth-card-agent" class="auth-card">
              <!-- Entête Soignants -->
              <div class="auth-card-header">
                <div class="auth-brand-badge">
                  <div class="brand-flag-large">
                    <div class="flag-green"></div>
                    <div class="flag-yellow"></div>
                    <div class="flag-blue"></div>
                  </div>
                  <div>
                    <h2 class="auth-title">GAB-SANTE</h2>
                    <p class="auth-sub">Portail d'Accès Professionnels de Santé</p>
                  </div>
                </div>
                <div class="auth-gov-tag">Espace Soignants & Praticiens</div>
              </div>

              <!-- Message d'erreur dynamique Soignant -->
              <div id="auth-error-box" class="auth-error-banner" style="display: none;"></div>

              <!-- Formulaire de connexion Soignant -->
              <form id="auth-custom-form" class="auth-single-form" onsubmit="window.AuthService.handleFormSubmit(event)">
                <div class="auth-notice-box">
                  🩺 <strong>Accès Praticien :</strong> Authentifiez-vous pour consulter les Dossiers Médicaux Partagés (DMP) et réguler les transferts hospitaliers.
                </div>

                <div class="auth-form-group">
                  <label for="auth-input-name">Nom complet ou Matricule du soignant *</label>
                  <input type="text" id="auth-input-name" placeholder="Ex: Dr. Eric Baye, Clarisse Mboumba ou MS-GA-48901" required autocomplete="name">
                  <span class="auth-input-hint">Vérification automatique dans l'annuaire médical (table <code>sani_staff</code>).</span>
                </div>

                <div class="auth-form-group">
                  <label for="auth-input-pin">Mot de passe de service *</label>
                  <div class="auth-password-wrapper">
                    <input type="password" id="auth-input-pin" placeholder="Entrez le mot de passe attribué" required autocomplete="current-password">
                    <button type="button" class="auth-password-toggle-btn" id="btn-toggle-password" onclick="window.AuthService.togglePasswordVisibility()" title="Afficher ou masquer le mot de passe" aria-label="Afficher ou masquer le mot de passe">
                      <span id="auth-password-eye-icon">👁️</span>
                    </button>
                  </div>
                </div>

                <div class="auth-form-actions">
                  <button type="submit" class="btn-primary auth-submit-btn">
                    <span>🔐</span> Ouvrir ma Session Médicale
                  </button>
                </div>
              </form>

              <!-- Séparation : Commutateur vers la console Administrateur -->
              <div class="auth-portal-switch-banner">
                <span style="font-size:0.78rem;color:#64748b;font-weight:600;">Vous êtes administrateur système ou responsable DSI ?</span>
                <button type="button" class="btn-switch-portal" onclick="window.AuthService.showAdminPortal()">
                  <span>🛡️</span> Accéder à la Console Administrateur →
                </button>
              </div>

              <!-- Pied de page Soignants -->
              <div class="auth-card-footer">
                <span class="auth-footer-shield">🔒</span>
                <span>Accès réservé aux soignants habilités. Chaque connexion est enregistrée pour la traçabilité DMP.</span>
              </div>
            </div>

            <!-- ============================================================ -->
            <!-- 2. CONSOLE D'AUTHENTIFICATION ADMINISTRATEUR SYSTÈME (DSI)    -->
            <!-- ============================================================ -->
            <div id="auth-card-admin" class="auth-card auth-admin-card" style="display: none;">
              <!-- Entête Administrateur -->
              <div class="auth-card-header">
                <div class="auth-brand-badge">
                  <div style="font-size: 1.8rem; line-height: 1;">🛡️</div>
                  <div>
                    <h2 class="auth-title">GAB-SANTE</h2>
                    <p class="auth-sub">Console d'Administration & Supervision</p>
                  </div>
                </div>
                <div style="background:rgba(220,38,38,0.2);color:#fca5a5;border:1px solid rgba(220,38,38,0.4);padding:3px 8px;border-radius:6px;font-size:0.68rem;font-weight:700;">ACCÈS RÉSERVÉ DSI</div>
              </div>

              <!-- Erreur dynamique Admin -->
              <div id="auth-admin-error-box" class="auth-error-banner" style="display: none; background:#450a0a; border-color:#991b1b; color:#fecaca;"></div>

              <!-- Onglets Admin -->
              <div style="display:flex;border-bottom:1px solid #334155;background:#0b1329;">
                <button id="admin-switch-tab-login" onclick="window.AuthService._switchAdminPortalTab('login')" style="flex:1;padding:10px;font-size:0.82rem;font-weight:700;color:#38bdf8;background:#1e293b;border:none;border-bottom:2px solid #38bdf8;cursor:pointer;">🔐 Connexion Admin</button>
                <button id="admin-switch-tab-chpwd" onclick="window.AuthService._switchAdminPortalTab('chpwd')" style="flex:1;padding:10px;font-size:0.82rem;font-weight:600;color:#94a3b8;background:#0b1329;border:none;border-bottom:2px solid transparent;cursor:pointer;">🔑 Modifier MDP Admin</button>
              </div>

              <!-- Formulaire Connexion Admin -->
              <div id="admin-portal-panel-login" style="padding:1.5rem;">
                <div class="auth-notice-box" style="background:#1e293b;border-color:#334155;color:#94a3b8;">
                  🛡️ <strong>Supervision Système :</strong> Connectez-vous pour surveiller en temps réel les connexions de chaque soignant et gérer le personnel.
                </div>

                <form onsubmit="window.AuthService.handleAdminFormSubmit(event)">
                  <div class="auth-form-group">
                    <label for="admin-portal-login">Identifiant Administrateur *</label>
                    <input type="text" id="admin-portal-login" placeholder="Ex: admin" required autocomplete="username">
                  </div>

                  <div class="auth-form-group">
                    <label for="admin-portal-pwd">Mot de passe Administrateur *</label>
                    <div class="auth-password-wrapper">
                      <input type="password" id="admin-portal-pwd" placeholder="Mot de passe confidentiel" required autocomplete="current-password">
                      <button type="button" class="auth-password-toggle-btn" onclick="window.AuthService._toggleAdminPwdVisibility('admin-portal-pwd','admin-eye-portal')" title="Afficher ou masquer le mot de passe">
                        <span id="admin-eye-portal" style="filter: brightness(1.2);">👁️</span>
                      </button>
                    </div>
                  </div>

                  <div class="auth-form-actions">
                    <button type="submit" class="btn-primary auth-submit-btn" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); border-color: #0284c7;">
                      <span>🛡️</span> Connexion Administrateur & Supervision
                    </button>
                  </div>
                </form>
              </div>

              <!-- Panel Modification Mot de Passe Admin -->
              <div id="admin-portal-panel-chpwd" style="padding:1.5rem;display:none;">
                <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:1rem;background:#1e293b;border:1px solid #334155;border-radius:8px;padding:8px 12px;">
                  🔑 Modifiez le mot de passe maître de l'administrateur système.
                </div>
                <div id="admin-portal-chpwd-msg" style="display:none;padding:8px 12px;border-radius:8px;font-size:0.8rem;margin-bottom:12px;"></div>
                <div style="display:flex;flex-direction:column;gap:12px;">
                  <div class="auth-form-group" style="margin:0;">
                    <label>Mot de passe admin actuel *</label>
                    <input type="password" id="admin-chpwd-old-portal" placeholder="Mot de passe actuel">
                  </div>
                  <div class="auth-form-group" style="margin:0;">
                    <label>Nouveau mot de passe * (min 8 caractères)</label>
                    <input type="password" id="admin-chpwd-new-portal" placeholder="Nouveau mot de passe fort">
                  </div>
                  <div class="auth-form-group" style="margin:0;">
                    <label>Confirmer le nouveau mot de passe *</label>
                    <input type="password" id="admin-chpwd-conf-portal" placeholder="Répéter le mot de passe">
                  </div>
                  <button type="button" onclick="window.AuthService.submitAdminPortalChangePassword()" class="btn-primary auth-submit-btn" style="margin-top:10px;">
                    <span>✔</span> Valider le Nouveau Mot de Passe
                  </button>
                </div>
              </div>

              <!-- Séparation : Commutateur retour Soignants -->
              <div class="auth-portal-switch-banner">
                <button type="button" class="btn-switch-portal" onclick="window.AuthService.showAgentPortal()">
                  <span>←</span> Revenir au Portail des Professionnels de Santé
                </button>
              </div>

              <!-- Pied de page Admin -->
              <div class="auth-card-footer">
                <span class="auth-footer-shield">🛡️</span>
                <span>Console de Direction des Systèmes d'Information (DSI) · Ministère de la Santé du Gabon.</span>
              </div>
            </div>

          </div>
        </div>

        <!-- MODALE DE BIENVENUE PERSONNALISÉE -->
        <div id="auth-welcome-modal" class="auth-welcome-overlay" style="display: none;" onclick="window.AuthService.closeWelcomeModal()">
          <div class="auth-welcome-box animate-bounce-in" onclick="event.stopPropagation()">
            <div class="auth-welcome-badge" id="auth-welcome-avatar">🏥</div>
            <div class="auth-welcome-content">
              <div class="auth-welcome-toplabel">AUTHENTIFICATION RÉUSSIE · BASE DE DONNÉES GABON</div>
              <h2 id="auth-welcome-text" class="auth-welcome-headline">Bonjour et bienvenue Docteur !</h2>
              <p id="auth-welcome-sub" class="auth-welcome-subtitle">Session active</p>
            </div>
            <div class="auth-welcome-actions-row">
              <button class="auth-welcome-btn-close" onclick="window.AuthService.closeWelcomeModal()" title="Accéder à l'espace de soins">
                <span>🏥 Accéder à l'Espace de Soins</span>
              </button>
              <button class="auth-welcome-btn-logout" onclick="window.AuthService.logout()" title="Fermer la session immédiatement">
                <span>🚪 Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(authContainer);
    }

    handleFormSubmit(e) {
      e.preventDefault();
      const name = document.getElementById('auth-input-name')?.value || '';
      const pin = document.getElementById('auth-input-pin')?.value || '';
      this.attemptLogin(name, pin);
    }

    togglePasswordVisibility() {
      const pinInput = document.getElementById('auth-input-pin');
      const eyeIcon = document.getElementById('auth-password-eye-icon');
      if (!pinInput) return;

      if (pinInput.type === 'password') {
        pinInput.type = 'text';
        if (eyeIcon) eyeIcon.textContent = '🙈';
      } else {
        pinInput.type = 'password';
        if (eyeIcon) eyeIcon.textContent = '👁️';
      }
      pinInput.focus();
    }

    // =========================================================================
    // CHANGEMENT DE MOT DE PASSE
    // =========================================================================

    openChangePasswordModal() {
      if (!this.currentAgent) return;
      let modal = document.getElementById('auth-change-pwd-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'auth-change-pwd-modal';
        modal.className = 'cpwd-modal-overlay';
        modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;';
        modal.innerHTML = `
          <div class="cpwd-modal-box" style="background:#fff;border-radius:14px;padding:2rem;width:100%;max-width:460px;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.5rem;">
              <span style="font-size:1.5rem;">🔑</span>
              <div>
                <h3 style="font-size:1.05rem;font-weight:700;color:#0f172a;margin:0;">Modifier mon mot de passe</h3>
                <p style="font-size:0.78rem;color:#64748b;margin:0;">Session : <strong>${this.escapeHtml(this.cleanAgentName(this.currentAgent.name))}</strong></p>
              </div>
            </div>
            <div id="cpwd-error" style="display:none;background:#fef2f2;border:1px solid #fca5a5;border-left:4px solid #dc2626;border-radius:8px;padding:10px 14px;margin-bottom:1rem;font-size:0.82rem;color:#b91c1c;font-weight:600;"></div>
            <div style="display:flex;flex-direction:column;gap:14px;">
              <div>
                <label style="font-size:0.8rem;font-weight:600;color:#374151;display:block;margin-bottom:4px;">Mot de passe actuel *</label>
                <input type="password" id="cpwd-current" placeholder="Votre mot de passe actuel" style="width:100%;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:0.85rem;box-sizing:border-box;" autocomplete="current-password">
              </div>
              <div>
                <label style="font-size:0.8rem;font-weight:600;color:#374151;display:block;margin-bottom:4px;">Nouveau mot de passe *</label>
                <input type="password" id="cpwd-new" placeholder="Minimum 6 caractères" style="width:100%;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:0.85rem;box-sizing:border-box;" autocomplete="new-password">
              </div>
              <div>
                <label style="font-size:0.8rem;font-weight:600;color:#374151;display:block;margin-bottom:4px;">Confirmer le nouveau mot de passe *</label>
                <input type="password" id="cpwd-confirm" placeholder="Répétez le nouveau mot de passe" style="width:100%;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:0.85rem;box-sizing:border-box;" autocomplete="new-password">
              </div>
            </div>
            <div style="display:flex;gap:10px;margin-top:1.5rem;justify-content:flex-end;">
              <button type="button" onclick="document.getElementById('auth-change-pwd-modal').style.display='none';" style="padding:8px 20px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;font-size:0.85rem;font-weight:600;color:#475569;cursor:pointer;">Annuler</button>
              <button type="button" id="cpwd-submit-btn" onclick="window.AuthService.submitChangePassword()" style="padding:8px 22px;background:#0072ce;color:white;border:none;border-radius:8px;font-size:0.85rem;font-weight:700;cursor:pointer;">✔ Valider le changement</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }
      // Vider les champs
      ['cpwd-current','cpwd-new','cpwd-confirm'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      const errEl = document.getElementById('cpwd-error');
      if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
      modal.style.display = 'flex';
    }

    async submitChangePassword() {
      const current = (document.getElementById('cpwd-current')?.value || '').trim();
      const newPwd  = (document.getElementById('cpwd-new')?.value || '').trim();
      const confirm = (document.getElementById('cpwd-confirm')?.value || '').trim();
      const errEl   = document.getElementById('cpwd-error');

      const showCpwdError = (msg) => {
        if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
      };

      if (!current || !newPwd || !confirm) { showCpwdError('Veuillez remplir tous les champs.'); return; }
      if (newPwd.length < 6) { showCpwdError('Le nouveau mot de passe doit contenir au moins 6 caractères.'); return; }
      if (newPwd !== confirm) { showCpwdError('Les deux nouveaux mots de passe ne correspondent pas.'); return; }

      const btn = document.getElementById('cpwd-submit-btn');
      if (btn) { btn.disabled = true; btn.textContent = '⏳ Vérification…'; }

      try {
        // Vérifier l'ancien mot de passe depuis la base
        const checkRes = await fetch(`${SUPABASE_REST_URL}?id=eq.${this.currentAgent.id}&select=pin_code`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        if (!checkRes.ok) throw new Error('Impossible de contacter la base de données.');
        const checkData = await checkRes.json();
        const storedPin = checkData && checkData[0] ? String(checkData[0].pin_code || '') : '';
        if (storedPin !== current) {
          showCpwdError('❌ Mot de passe actuel incorrect. Vérifiez votre saisie.');
          if (btn) { btn.disabled = false; btn.textContent = '✔ Valider le changement'; }
          return;
        }

        // Mettre à jour le mot de passe en base
        const updateRes = await fetch(`${SUPABASE_REST_URL}?id=eq.${this.currentAgent.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ pin_code: newPwd })
        });
        if (!updateRes.ok) throw new Error('Erreur lors de la mise à jour du mot de passe.');

        // Succès
        document.getElementById('auth-change-pwd-modal').style.display = 'none';
        if (window.saniApp && typeof window.saniApp.showToast === 'function') {
          window.saniApp.showToast('✅ Mot de passe mis à jour avec succès !');
        }
      } catch (err) {
        showCpwdError(`❌ Erreur : ${err.message}`);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '✔ Valider le changement'; }
      }
    }

    // =========================================================================
    // PANNEAU D'ADMINISTRATION DU PERSONNEL
    // =========================================================================

    openAdminPanel() {
      let modal = document.getElementById('auth-admin-panel-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'auth-admin-panel-modal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.65);display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:2rem 1rem;box-sizing:border-box;';
        modal.innerHTML = `
          <div style="background:#fff;border-radius:14px;width:100%;max-width:960px;box-shadow:0 20px 60px rgba(0,0,0,0.3);margin:auto;">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid #e2e8f0;background:#0f172a;border-radius:14px 14px 0 0;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:1.4rem;">👥</span>
                <div>
                  <h3 style="margin:0;color:#fff;font-size:1rem;font-weight:700;">Administration du Personnel Soignant</h3>
                  <p style="margin:0;color:#94a3b8;font-size:0.75rem;">Gérer les agents, mots de passe et statuts · Table sani_staff</p>
                </div>
              </div>
              <button onclick="document.getElementById('auth-admin-panel-modal').style.display='none';" style="background:none;border:none;color:#94a3b8;font-size:1.4rem;cursor:pointer;padding:4px 8px;border-radius:6px;" title="Fermer">✕</button>
            </div>

            <!-- Formulaire ajout agent -->
            <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #e2e8f0;background:#f8fafc;">
              <h4 style="font-size:0.88rem;font-weight:700;color:#0f172a;margin:0 0 12px;">➕ Ajouter un nouvel agent</h4>
              <div id="admin-add-error" style="display:none;background:#fef2f2;border:1px solid #fca5a5;border-left:4px solid #dc2626;border-radius:8px;padding:8px 12px;margin-bottom:10px;font-size:0.8rem;color:#b91c1c;font-weight:600;"></div>
              <div id="admin-add-success" style="display:none;background:#f0fdf4;border:1px solid #86efac;border-left:4px solid #16a34a;border-radius:8px;padding:8px 12px;margin-bottom:10px;font-size:0.8rem;color:#15803d;font-weight:600;"></div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;" id="admin-add-form">
                <div><label style="font-size:0.75rem;font-weight:600;color:#374151;display:block;margin-bottom:3px;">Nom complet *</label><input type="text" id="aad-name" placeholder="Dr. Prénom Nom" style="width:100%;padding:7px 10px;border:1px solid #d1d5db;border-radius:7px;font-size:0.82rem;box-sizing:border-box;"></div>
                <div><label style="font-size:0.75rem;font-weight:600;color:#374151;display:block;margin-bottom:3px;">Matricule *</label><input type="text" id="aad-matricule" placeholder="MS-GA-XXXXX" style="width:100%;padding:7px 10px;border:1px solid #d1d5db;border-radius:7px;font-size:0.82rem;box-sizing:border-box;"></div>
                <div><label style="font-size:0.75rem;font-weight:600;color:#374151;display:block;margin-bottom:3px;">Rôle *</label>
                  <select id="aad-role" style="width:100%;padding:7px 10px;border:1px solid #d1d5db;border-radius:7px;font-size:0.82rem;box-sizing:border-box;">
                    <option value="medecin">Médecin</option>
                    <option value="infirmiere">Infirmier(e)</option>
                    <option value="sage_femme">Sage-femme</option>
                    <option value="pharmacien">Pharmacien(ne)</option>
                    <option value="samu">Régulateur SAMU</option>
                    <option value="aide_soignant">Aide-soignant(e)</option>
                  </select>
                </div>
                <div><label style="font-size:0.75rem;font-weight:600;color:#374151;display:block;margin-bottom:3px;">Genre *</label>
                  <select id="aad-gender" style="width:100%;padding:7px 10px;border:1px solid #d1d5db;border-radius:7px;font-size:0.82rem;box-sizing:border-box;">
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <div><label style="font-size:0.75rem;font-weight:600;color:#374151;display:block;margin-bottom:3px;">CHU *</label>
                  <select id="aad-chu" style="width:100%;padding:7px 10px;border:1px solid #d1d5db;border-radius:7px;font-size:0.82rem;box-sizing:border-box;">
                    <option value="chul">CHU de Libreville (CHUL)</option>
                    <option value="chuo">CHU d'Owendo (CHUO)</option>
                    <option value="chumef">CHU Mère-Enfant Jeanne Ebori (CHUMEF)</option>
                    <option value="chua">CHU d'Angondjé (CHUA)</option>
                    <option value="chrf">CHR Franceville (CHRF)</option>
                    <option value="chrpog">CHR Port-Gentil (CHRPOG)</option>
                    <option value="hasl">Hôpital Albert Schweitzer (HASL)</option>
                  </select>
                </div>
                <div><label style="font-size:0.75rem;font-weight:600;color:#374151;display:block;margin-bottom:3px;">Service</label><input type="text" id="aad-service" placeholder="Ex: Urgences, Réa, Pédiatrie…" style="width:100%;padding:7px 10px;border:1px solid #d1d5db;border-radius:7px;font-size:0.82rem;box-sizing:border-box;"></div>
                <div><label style="font-size:0.75rem;font-weight:600;color:#374151;display:block;margin-bottom:3px;">Mot de passe initial *</label><input type="text" id="aad-pwd" placeholder="Min. 6 caractères" style="width:100%;padding:7px 10px;border:1px solid #d1d5db;border-radius:7px;font-size:0.82rem;box-sizing:border-box;"></div>
              </div>
              <button onclick="window.AuthService.adminAddAgent()" style="margin-top:12px;padding:8px 20px;background:#0072ce;color:white;border:none;border-radius:8px;font-size:0.83rem;font-weight:700;cursor:pointer;">➕ Enregistrer l'agent</button>
            </div>

            <!-- Liste du personnel -->
            <div style="padding:1.25rem 1.5rem;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <h4 style="font-size:0.88rem;font-weight:700;color:#0f172a;margin:0;">📋 Personnel enregistré</h4>
                <button onclick="window.AuthService.loadAndRenderStaffList()" style="padding:5px 14px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:7px;font-size:0.78rem;font-weight:600;color:#475569;cursor:pointer;">🔄 Actualiser</button>
              </div>
              <div id="admin-staff-list" style="display:flex;flex-direction:column;gap:8px;max-height:400px;overflow-y:auto;">
                <div style="text-align:center;padding:2rem;color:#94a3b8;font-size:0.85rem;">⏳ Chargement en cours…</div>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }
      modal.style.display = 'flex';
      this.loadAndRenderStaffList();
    }

    async loadAndRenderStaffList() {
      const listEl = document.getElementById('admin-staff-list');
      if (!listEl) return;
      listEl.innerHTML = '<div style="text-align:center;padding:1.5rem;color:#94a3b8;font-size:0.85rem;">⏳ Chargement depuis Supabase…</div>';

      try {
        const res = await fetch(`${SUPABASE_REST_URL}?select=*&order=name.asc`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        if (!res.ok) throw new Error('Erreur réseau Supabase');
        const staff = await res.json();

        if (!staff || staff.length === 0) {
          listEl.innerHTML = '<div style="text-align:center;padding:1.5rem;color:#94a3b8;">Aucun agent trouvé.</div>';
          return;
        }

        const roleLabel = { medecin: 'Médecin', infirmiere: 'Infirmier(e)', sage_femme: 'Sage-femme', pharmacien: 'Pharmacien(ne)', samu: 'Régulateur SAMU', aide_soignant: 'Aide-soignant(e)' };
        listEl.innerHTML = staff.map(s => {
          const isActive = s.is_active !== false;
          const cleanName = this.cleanAgentName(s.name);
          return `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;background:${isActive ? '#fff' : '#fafafa'};">
              <div style="flex:1;min-width:0;">
                <div style="font-weight:700;font-size:0.88rem;color:#0f172a;">${this.escapeHtml(cleanName)}</div>
                <div style="font-size:0.75rem;color:#64748b;margin-top:2px;">${roleLabel[s.role] || s.role} · ${this.escapeHtml(s.hospital_name || s.hospital_id || '')} · <code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;font-size:0.72rem;">${this.escapeHtml(s.matricule || '')}</code></div>
              </div>
              <span style="padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;${isActive ? 'background:#dcfce7;color:#166534;' : 'background:#fef2f2;color:#b91c1c;'}">${isActive ? '● Actif' : '● Désactivé'}</span>
              <button onclick="window.AuthService.adminResetPassword('${s.id}','${this.escapeHtml(cleanName).replace(/'/g,"\\'")}')" style="padding:5px 10px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:7px;font-size:0.75rem;font-weight:600;color:#1d4ed8;cursor:pointer;white-space:nowrap;">✏️ Réinit. MDP</button>
              <button onclick="window.AuthService.adminToggleActive('${s.id}',${isActive},'${this.escapeHtml(cleanName).replace(/'/g,"\\'")}')" style="padding:5px 10px;background:${isActive ? '#fef2f2' : '#f0fdf4'};border:1px solid ${isActive ? '#fca5a5' : '#86efac'};border-radius:7px;font-size:0.75rem;font-weight:600;color:${isActive ? '#b91c1c' : '#15803d'};cursor:pointer;white-space:nowrap;">${isActive ? '🔴 Désactiver' : '🟢 Réactiver'}</button>
            </div>
          `;
        }).join('');
      } catch (err) {
        listEl.innerHTML = `<div style="padding:1rem;color:#b91c1c;font-size:0.82rem;">❌ Erreur : ${err.message}</div>`;
      }
    }

    async adminResetPassword(agentId, agentName) {
      const newPwd = prompt(`Nouveau mot de passe pour « ${agentName} » :\n(minimum 6 caractères)`);
      if (newPwd === null) return;
      if (!newPwd || newPwd.trim().length < 6) {
        alert('❌ Mot de passe invalide. Il doit contenir au moins 6 caractères.');
        return;
      }
      try {
        const res = await fetch(`${SUPABASE_REST_URL}?id=eq.${agentId}`, {
          method: 'PATCH',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({ pin_code: newPwd.trim() })
        });
        if (!res.ok) throw new Error('Erreur de mise à jour.');
        if (window.saniApp && typeof window.saniApp.showToast === 'function') window.saniApp.showToast(`✅ Mot de passe de ${agentName} réinitialisé.`);
        this.loadAndRenderStaffList();
      } catch (err) {
        alert(`❌ Erreur : ${err.message}`);
      }
    }

    async adminToggleActive(agentId, currentStatus, agentName) {
      const action = currentStatus ? 'désactiver' : 'réactiver';
      if (!confirm(`Voulez-vous ${action} le compte de « ${agentName} » ?`)) return;
      try {
        const res = await fetch(`${SUPABASE_REST_URL}?id=eq.${agentId}`, {
          method: 'PATCH',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({ is_active: !currentStatus })
        });
        if (!res.ok) throw new Error('Erreur de mise à jour.');
        if (window.saniApp && typeof window.saniApp.showToast === 'function') window.saniApp.showToast(`✅ Compte de ${agentName} ${currentStatus ? 'désactivé' : 'réactivé'}.`);
        this.loadAndRenderStaffList();
      } catch (err) {
        alert(`❌ Erreur : ${err.message}`);
      }
    }

    async adminAddAgent() {
      const name      = (document.getElementById('aad-name')?.value || '').trim();
      const matricule = (document.getElementById('aad-matricule')?.value || '').trim();
      const role      = document.getElementById('aad-role')?.value || 'medecin';
      const gender    = document.getElementById('aad-gender')?.value || 'M';
      const chuId     = document.getElementById('aad-chu')?.value || 'chul';
      const service   = (document.getElementById('aad-service')?.value || '').trim();
      const pwd       = (document.getElementById('aad-pwd')?.value || '').trim();

      const errEl  = document.getElementById('admin-add-error');
      const succEl = document.getElementById('admin-add-success');
      const showAddErr = (msg) => { if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; } if (succEl) succEl.style.display = 'none'; };
      const showAddOk  = (msg) => { if (succEl) { succEl.textContent = msg; succEl.style.display = 'block'; } if (errEl) errEl.style.display = 'none'; };

      if (!name || !matricule || !pwd) { showAddErr('⚠️ Nom, Matricule et Mot de passe sont obligatoires.'); return; }
      if (pwd.length < 6) { showAddErr('⚠️ Le mot de passe doit contenir au moins 6 caractères.'); return; }

      const chuNames = { chul:'CHU de Libreville (CHUL)', chuo:"CHU d'Owendo (CHUO)", chumef:'CHU Mère-Enfant Jeanne Ebori (CHUMEF)', chua:"CHU d'Angondjé (CHUA)", chrf:'CHR Franceville (CHRF)', chrpog:'CHR Port-Gentil (CHRPOG)', hasl:'Hôpital Albert Schweitzer (HASL)' };
      const titleMap = { medecin: gender === 'F' ? 'Docteur' : 'Docteur', infirmiere: gender === 'F' ? 'Infirmière' : 'Infirmier', sage_femme: 'Sage-femme', pharmacien: gender === 'F' ? 'Docteur Pharmacienne' : 'Docteur Pharmacien', samu: 'Docteur Régulateur SAMU', aide_soignant: gender === 'F' ? 'Aide-soignante' : 'Aide-soignant' };
      const newId = `STF-${chuId.toUpperCase()}-${Date.now().toString().slice(-5)}`;
      const cleanName = this.cleanAgentName(name);
      const normalizedName = cleanName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\b(dr|docteur|pr|professeur|mme|madame|m|monsieur)\b\.?/gi, '').replace(/[^a-z0-9]/gi, '').trim();

      const payload = {
        id: newId,
        matricule,
        name: cleanName,
        normalized_name: normalizedName,
        role,
        gender,
        title_label: titleMap[role] || 'Soignant',
        hospital_id: chuId,
        hospital_name: chuNames[chuId] || chuId,
        service: service || 'Soins Généraux',
        pin_code: pwd,
        avatar: '',
        is_active: true
      };

      try {
        const res = await fetch(SUPABASE_REST_URL, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.message || errBody.details || `HTTP ${res.status}`);
        }
        showAddOk(`✅ Agent « ${cleanName} » ajouté avec succès ! (ID: ${newId})`);
        // Réinitialiser le formulaire
        ['aad-name','aad-matricule','aad-service','aad-pwd'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        // Mettre à jour le fallback local
        this.databaseStaff.push(payload);
        this.loadAndRenderStaffList();
      } catch (err) {
        showAddErr(`❌ Erreur lors de l'ajout : ${err.message}`);
      }
    }

    // =========================================================================
    // CONNEXION ET ESPACE ADMINISTRATEUR (CONSOLE SÉPARÉE)
    // =========================================================================

    _getAdminCredentials() {
      try {
        const saved = localStorage.getItem('sani_admin_credentials');
        if (saved) return JSON.parse(saved);
      } catch(e) {}
      return { login: 'admin', password: 'Admin@GABSANTE2026' };
    }

    _saveAdminCredentials(login, password) {
      localStorage.setItem('sani_admin_credentials', JSON.stringify({ login, password }));
    }

    _switchAdminPortalTab(tab) {
      const panelLogin = document.getElementById('admin-portal-panel-login');
      const panelChpwd = document.getElementById('admin-portal-panel-chpwd');
      const tabLogin   = document.getElementById('admin-switch-tab-login');
      const tabChpwd   = document.getElementById('admin-switch-tab-chpwd');
      if (!panelLogin || !panelChpwd) return;

      if (tab === 'login') {
        panelLogin.style.display = 'block';
        panelChpwd.style.display = 'none';
        if (tabLogin) { tabLogin.style.color = '#38bdf8'; tabLogin.style.background = '#1e293b'; tabLogin.style.borderBottomColor = '#38bdf8'; tabLogin.style.fontWeight = '700'; }
        if (tabChpwd) { tabChpwd.style.color = '#94a3b8'; tabChpwd.style.background = '#0b1329'; tabChpwd.style.borderBottomColor = 'transparent'; tabChpwd.style.fontWeight = '600'; }
      } else {
        panelLogin.style.display = 'none';
        panelChpwd.style.display = 'block';
        if (tabChpwd) { tabChpwd.style.color = '#38bdf8'; tabChpwd.style.background = '#1e293b'; tabChpwd.style.borderBottomColor = '#38bdf8'; tabChpwd.style.fontWeight = '700'; }
        if (tabLogin) { tabLogin.style.color = '#94a3b8'; tabLogin.style.background = '#0b1329'; tabLogin.style.borderBottomColor = 'transparent'; tabLogin.style.fontWeight = '600'; }
      }
    }

    handleAdminFormSubmit(e) {
      e.preventDefault();
      const login = (document.getElementById('admin-portal-login')?.value || '').trim();
      const pwd   = (document.getElementById('admin-portal-pwd')?.value || '').trim();
      this.executeAdminLogin(login, pwd, 'auth-admin-error-box');
    }

    submitAdminPortalChangePassword() {
      const current = (document.getElementById('admin-chpwd-old-portal')?.value || '').trim();
      const newPwd  = (document.getElementById('admin-chpwd-new-portal')?.value || '').trim();
      const confirm = (document.getElementById('admin-chpwd-conf-portal')?.value || '').trim();
      const msgEl   = document.getElementById('admin-portal-chpwd-msg');

      const showMsg = (text, isOk) => {
        if (!msgEl) return;
        msgEl.style.display = 'block';
        msgEl.style.background = isOk ? '#064e3b' : '#450a0a';
        msgEl.style.color = isOk ? '#a7f3d0' : '#fecaca';
        msgEl.style.border = `1px solid ${isOk ? '#059669' : '#b91c1c'}`;
        msgEl.textContent = text;
      };

      if (!current || !newPwd || !confirm) { showMsg('Veuillez remplir tous les champs.', false); return; }
      if (newPwd.length < 8) { showMsg('Le nouveau mot de passe doit comporter au moins 8 caractères.', false); return; }
      if (newPwd !== confirm) { showMsg('Les deux nouveaux mots de passe ne correspondent pas.', false); return; }

      const creds = this._getAdminCredentials();
      if (current !== creds.password) { showMsg('❌ Mot de passe administrateur actuel incorrect.', false); return; }

      this._saveAdminCredentials(creds.login, newPwd);
      ['admin-chpwd-old-portal','admin-chpwd-new-portal','admin-chpwd-conf-portal'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      showMsg('✅ Mot de passe Administrateur modifié avec succès !', true);
    }

    executeAdminLogin(loginInput, pwdInput, errorBoxId) {
      const errEl = document.getElementById(errorBoxId);
      const showErr = (msg) => { if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; } };
      if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }

      if (!loginInput || !pwdInput) { showErr("Veuillez renseigner l'identifiant et le mot de passe administrateur."); return; }

      const creds = this._getAdminCredentials();
      if (loginInput !== creds.login || pwdInput !== creds.password) {
        this.recordLoginEvent({ id: 'ADMIN-ERR', name: 'Tentative Admin', role: 'admin' }, 'FAILED', `Échec mot de passe (login: ${loginInput})`);
        showErr("❌ Identifiant ou mot de passe administrateur incorrect.");
        return;
      }

      this._adminAuthenticated = true;
      const adminSession = {
        id: 'ADMIN-GAB-SANTE',
        matricule: 'ADM-GA-00001',
        name: 'Administrateur GAB-SANTE',
        role: 'admin',
        gender: 'M',
        titleLabel: 'Administrateur DSI',
        hospitalId: 'chul',
        hospitalName: 'Direction Générale · Ministère de la Santé',
        service: 'Supervision & Audit Réseau',
        avatar: '',
        authenticatedAt: new Date().toISOString(),
        isAdmin: true
      };

      this.currentAgent = adminSession;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(adminSession));

      // Enregistrer la connexion admin dans l'audit
      this.recordLoginEvent(adminSession, 'SUCCESS', 'Connexion Administrateur Système réussie');

      const modalAdminLogin = document.getElementById('auth-admin-login-modal');
      if (modalAdminLogin) modalAdminLogin.style.display = 'none';
      this.hideLoginPortal();

      this.updateTopbarUserBadge();
      this.updateSidebarSessionWidget();
      this.syncHospitalWithApp(adminSession.hospitalId);

      const welcomeModal = document.getElementById('auth-welcome-modal');
      const welcomeText  = document.getElementById('auth-welcome-text');
      const welcomeSub   = document.getElementById('auth-welcome-sub');
      const welcomeAvatar= document.getElementById('auth-welcome-avatar');
      if (welcomeText)   welcomeText.textContent  = '🛡️ Bienvenue Administrateur GAB-SANTE !';
      if (welcomeSub)    welcomeSub.textContent    = 'Session DSI Active · Supervision des Connexions & Gestion du Personnel';
      if (welcomeAvatar) welcomeAvatar.textContent = '🏥';
      if (welcomeModal)  {
        welcomeModal.style.display = 'flex';
        setTimeout(() => { if (welcomeModal.style.display === 'flex') welcomeModal.style.display = 'none'; }, 3500);
      }
    }

    _toggleAdminPwdVisibility(inputId, eyeId) {
      const inp = document.getElementById(inputId);
      const eye = document.getElementById(eyeId);
      if (!inp) return;
      inp.type = inp.type === 'password' ? 'text' : 'password';
      if (eye) eye.textContent = inp.type === 'password' ? '👁️' : '🙈';
    }

    // Modal administrateur pour changer le mot de passe depuis l'intérieur
    openAdminLoginModal() {
      let modal = document.getElementById('auth-admin-login-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'auth-admin-login-modal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;';
        modal.innerHTML = `
          <div style="background:#fff;border-radius:16px;width:100%;max-width:440px;box-shadow:0 24px 64px rgba(0,0,0,0.4);overflow:hidden;">
            <div style="background:#0f172a;padding:1.25rem 1.5rem;display:flex;align-items:center;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:1.4rem;">🔑</span>
                <div>
                  <div style="color:#fff;font-size:1rem;font-weight:700;">Sécurité Administrateur</div>
                  <div style="color:#94a3b8;font-size:0.72rem;">Modifier le mot de passe maître DSI</div>
                </div>
              </div>
              <button onclick="document.getElementById('auth-admin-login-modal').style.display='none';" style="background:none;border:none;color:#94a3b8;font-size:1.3rem;cursor:pointer;">✕</button>
            </div>
            <div style="padding:1.5rem;">
              <div id="admin-chpwd-error" style="display:none;background:#fef2f2;border:1px solid #fca5a5;border-left:4px solid #dc2626;border-radius:8px;padding:10px 14px;margin-bottom:1rem;font-size:0.82rem;color:#b91c1c;font-weight:600;"></div>
              <div id="admin-chpwd-success" style="display:none;background:#f0fdf4;border:1px solid #86efac;border-left:4px solid #16a34a;border-radius:8px;padding:10px 14px;margin-bottom:1rem;font-size:0.82rem;color:#15803d;font-weight:600;"></div>
              <div style="display:flex;flex-direction:column;gap:12px;">
                <div>
                  <label style="font-size:0.8rem;font-weight:600;color:#374151;display:block;margin-bottom:4px;">Mot de passe actuel *</label>
                  <input type="password" id="admin-chpwd-current" placeholder="Mot de passe actuel" style="width:100%;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:0.85rem;box-sizing:border-box;">
                </div>
                <div>
                  <label style="font-size:0.8rem;font-weight:600;color:#374151;display:block;margin-bottom:4px;">Nouveau mot de passe *</label>
                  <input type="password" id="admin-chpwd-new" placeholder="Minimum 8 caractères" style="width:100%;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:0.85rem;box-sizing:border-box;">
                </div>
                <div>
                  <label style="font-size:0.8rem;font-weight:600;color:#374151;display:block;margin-bottom:4px;">Confirmer le nouveau mot de passe *</label>
                  <input type="password" id="admin-chpwd-confirm" placeholder="Répéter le nouveau mot de passe" style="width:100%;padding:9px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:0.85rem;box-sizing:border-box;">
                </div>
              </div>
              <div style="margin-top:1.25rem;display:flex;gap:10px;justify-content:flex-end;">
                <button onclick="document.getElementById('auth-admin-login-modal').style.display='none';" style="padding:8px 16px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;font-size:0.82rem;font-weight:600;color:#475569;cursor:pointer;">Annuler</button>
                <button onclick="window.AuthService.submitAdminChangePassword()" style="padding:8px 20px;background:#0072ce;color:white;border:none;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer;">🔑 Enregistrer</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }
      modal.style.display = 'flex';
    }

    submitAdminChangePassword() {
      const current = (document.getElementById('admin-chpwd-current')?.value || '').trim();
      const newPwd  = (document.getElementById('admin-chpwd-new')?.value || '').trim();
      const confirm = (document.getElementById('admin-chpwd-confirm')?.value || '').trim();
      const errEl   = document.getElementById('admin-chpwd-error');
      const succEl  = document.getElementById('admin-chpwd-success');

      const showErr = (msg) => { if (errEl) { errEl.textContent=msg; errEl.style.display='block'; } if (succEl) succEl.style.display='none'; };
      const showOk  = (msg) => { if (succEl) { succEl.textContent=msg; succEl.style.display='block'; } if (errEl) errEl.style.display='none'; };
      if (errEl) { errEl.textContent=''; errEl.style.display='none'; }
      if (succEl) { succEl.textContent=''; succEl.style.display='none'; }

      if (!current || !newPwd || !confirm) { showErr('Veuillez remplir tous les champs.'); return; }
      if (newPwd.length < 8) { showErr('Le nouveau mot de passe doit contenir au moins 8 caractères.'); return; }
      if (newPwd !== confirm) { showErr('Les deux nouveaux mots de passe ne correspondent pas.'); return; }

      const creds = this._getAdminCredentials();
      if (current !== creds.password) { showErr('❌ Mot de passe actuel incorrect.'); return; }

      this._saveAdminCredentials(creds.login, newPwd);
      ['admin-chpwd-current','admin-chpwd-new','admin-chpwd-confirm'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      showOk('✅ Mot de passe administrateur modifié avec succès !');
    }

    // =========================================================================
    // TABLEAU DE BORD DE SURVEILLANCE DES CONNEXIONS DES AGENTS (ADMIN)
    // =========================================================================

    openConnectionsMonitor() {
      let modal = document.getElementById('auth-connections-monitor-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'auth-connections-monitor-modal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,0.85);backdrop-filter:blur(6px);display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:1.5rem 1rem;box-sizing:border-box;';
        modal.innerHTML = `
          <div style="background:#ffffff;border-radius:16px;width:100%;max-width:1100px;box-shadow:0 25px 60px rgba(0,0,0,0.4);margin:auto;overflow:hidden;">
            <!-- En-tête -->
            <div style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%);padding:1.25rem 1.75rem;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.1);">
              <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:42px;height:42px;background:rgba(2,132,199,0.2);border:1px solid rgba(2,132,199,0.4);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;">📊</div>
                <div>
                  <h3 style="margin:0;color:#ffffff;font-size:1.1rem;font-weight:700;">Supervision & Surveillance des Connexions Soignants</h3>
                  <p style="margin:2px 0 0;color:#94a3b8;font-size:0.75rem;">Traçabilité en temps réel des accès DMP · Réseau Hospitalier du Gabon (Table <code>sani_staff</code>)</p>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:10px;">
                <button onclick="window.AuthService.exportConnectionLogsCsv()" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:7px;font-size:0.78rem;font-weight:600;cursor:pointer;" title="Télécharger le rapport CSV">📥 Exporter CSV</button>
                <button onclick="window.AuthService.loadAndRenderConnections()" style="background:#0284c7;border:none;color:#ffffff;padding:6px 14px;border-radius:7px;font-size:0.78rem;font-weight:700;cursor:pointer;">🔄 Actualiser</button>
                <button onclick="document.getElementById('auth-connections-monitor-modal').style.display='none';" style="background:none;border:none;color:#94a3b8;font-size:1.4rem;cursor:pointer;padding:4px 8px;border-radius:6px;" title="Fermer">✕</button>
              </div>
            </div>

            <!-- KPIs en haut -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;padding:1.25rem 1.75rem;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
              <div class="conn-kpi-card">
                <div class="conn-kpi-icon" style="background:#eff6ff;color:#1d4ed8;">👥</div>
                <div>
                  <div style="font-size:0.75rem;color:#64748b;font-weight:600;">Total Soignants en Base</div>
                  <div id="conn-kpi-total-staff" style="font-size:1.3rem;font-weight:800;color:#0f172a;">--</div>
                </div>
              </div>
              <div class="conn-kpi-card">
                <div class="conn-kpi-icon" style="background:#dcfce7;color:#15803d;">🟢</div>
                <div>
                  <div style="font-size:0.75rem;color:#64748b;font-weight:600;">Connectés Récemment</div>
                  <div id="conn-kpi-recent" style="font-size:1.3rem;font-weight:800;color:#15803d;">--</div>
                </div>
              </div>
              <div class="conn-kpi-card">
                <div class="conn-kpi-icon" style="background:#fef3c7;color:#b45309;">📋</div>
                <div>
                  <div style="font-size:0.75rem;color:#64748b;font-weight:600;">Total Logs Enregistrés</div>
                  <div id="conn-kpi-logs-count" style="font-size:1.3rem;font-weight:800;color:#b45309;">--</div>
                </div>
              </div>
              <div class="conn-kpi-card">
                <div class="conn-kpi-icon" style="background:#f3e8ff;color:#7e22ce;">🏥</div>
                <div>
                  <div style="font-size:0.75rem;color:#64748b;font-weight:600;">Structures Actives</div>
                  <div id="conn-kpi-chu-count" style="font-size:1.3rem;font-weight:800;color:#7e22ce;">7 CHU</div>
                </div>
              </div>
            </div>

            <!-- Onglets de la modale de supervision -->
            <div style="display:flex;border-bottom:1px solid #e2e8f0;background:#ffffff;padding:0 1.75rem;">
              <button id="conn-tab-staff" onclick="window.AuthService._switchConnTab('staff')" style="padding:12px 18px;font-size:0.85rem;font-weight:700;color:#0072ce;background:none;border:none;border-bottom:3px solid #0072ce;cursor:pointer;">👥 État de Connexion de Chaque Soignant</button>
              <button id="conn-tab-logs" onclick="window.AuthService._switchConnTab('logs')" style="padding:12px 18px;font-size:0.85rem;font-weight:600;color:#64748b;background:none;border:none;border-bottom:3px solid transparent;cursor:pointer;">📋 Journal Chronologique des Connexions (Audit)</button>
            </div>

            <!-- Barre de filtre & recherche -->
            <div style="padding:1rem 1.75rem;background:#ffffff;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #f1f5f9;">
              <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:260px;">
                <input type="text" id="conn-search-input" placeholder="🔍 Rechercher un agent par nom ou matricule..." oninput="window.AuthService.filterConnections()" style="padding:7px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:0.82rem;width:100%;max-width:320px;box-sizing:border-box;">
                <select id="conn-chu-filter" onchange="window.AuthService.filterConnections()" style="padding:7px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:0.82rem;background:#fff;">
                  <option value="">Tous les établissements</option>
                  <option value="chul">CHU de Libreville (CHUL)</option>
                  <option value="chuo">CHU d'Owendo (CHUO)</option>
                  <option value="chumef">CHU Mère-Enfant (CHUMEF)</option>
                  <option value="chua">CHU d'Angondjé (CHUA)</option>
                  <option value="chrf">CHR Franceville (CHRF)</option>
                  <option value="chrpog">CHR Port-Gentil (CHRPOG)</option>
                  <option value="hasl">Hôpital Albert Schweitzer (HASL)</option>
                </select>
              </div>
              <div id="conn-counter-hint" style="font-size:0.78rem;color:#64748b;">Chargement des données...</div>
            </div>

            <!-- Contenu 1 : Tableau des Soignants avec dernière connexion -->
            <div id="conn-panel-staff" style="padding:1rem 1.75rem;max-height:480px;overflow-y:auto;">
              <div id="conn-staff-table-container">
                <div style="text-align:center;padding:2rem;color:#94a3b8;">⏳ Chargement de l'annuaire depuis Supabase...</div>
              </div>
            </div>

            <!-- Contenu 2 : Journal d'Audit chronologique -->
            <div id="conn-panel-logs" style="padding:1rem 1.75rem;max-height:480px;overflow-y:auto;display:none;">
              <div id="conn-logs-list-container">
                <div style="text-align:center;padding:2rem;color:#94a3b8;">⏳ Chargement du journal des accès...</div>
              </div>
            </div>

            <!-- Pied de page modale -->
            <div style="background:#f8fafc;padding:0.9rem 1.75rem;border-top:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;font-size:0.75rem;color:#64748b;">
              <span>🛡️ Journal d'audit conforme aux normes de sécurité sanitaire du Gabon.</span>
              <button onclick="window.AuthService.clearConnectionLogs()" style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:0.75rem;text-decoration:underline;">Purger l'historique local</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }
      modal.style.display = 'flex';
      this.loadAndRenderConnections();
    }

    _switchConnTab(tab) {
      const panelStaff = document.getElementById('conn-panel-staff');
      const panelLogs  = document.getElementById('conn-panel-logs');
      const tabStaff   = document.getElementById('conn-tab-staff');
      const tabLogs    = document.getElementById('conn-tab-logs');
      if (!panelStaff || !panelLogs) return;

      if (tab === 'staff') {
        panelStaff.style.display = 'block';
        panelLogs.style.display  = 'none';
        if (tabStaff) { tabStaff.style.color = '#0072ce'; tabStaff.style.borderBottomColor = '#0072ce'; tabStaff.style.fontWeight = '700'; }
        if (tabLogs)  { tabLogs.style.color = '#64748b'; tabLogs.style.borderBottomColor = 'transparent'; tabLogs.style.fontWeight = '600'; }
      } else {
        panelStaff.style.display = 'none';
        panelLogs.style.display  = 'block';
        if (tabLogs)  { tabLogs.style.color = '#0072ce'; tabLogs.style.borderBottomColor = '#0072ce'; tabLogs.style.fontWeight = '700'; }
        if (tabStaff) { tabStaff.style.color = '#64748b'; tabStaff.style.borderBottomColor = 'transparent'; tabStaff.style.fontWeight = '600'; }
      }
    }

    async loadAndRenderConnections() {
      // 1. Charger le personnel depuis Supabase
      try {
        const res = await fetch(`${SUPABASE_REST_URL}?select=*&order=name.asc`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            this.databaseStaff = data.map(s => {
              s.name = this.cleanAgentName(s.name);
              s.avatar = '';
              return s;
            });
          }
        }
      } catch(e) {
        console.warn('[GAB-SANTE] Chargement staff depuis DB échoué, utilisation mémoire.');
      }

      this._allStaffCache = this.databaseStaff || FALLBACK_STAFF;
      this._allLogsCache  = this.getLoginLogs();

      // Mettre à jour les KPIs
      const kpiTotal = document.getElementById('conn-kpi-total-staff');
      const kpiRecent = document.getElementById('conn-kpi-recent');
      const kpiLogs = document.getElementById('conn-kpi-logs-count');

      if (kpiTotal) kpiTotal.textContent = this._allStaffCache.length;

      const recentCount = this._allStaffCache.filter(s => s.last_login).length;
      if (kpiRecent) kpiRecent.textContent = recentCount;
      if (kpiLogs) kpiLogs.textContent = this._allLogsCache.length;

      this.filterConnections();
    }

    filterConnections() {
      const q = (document.getElementById('conn-search-input')?.value || '').toLowerCase().trim();
      const chuFilter = document.getElementById('conn-chu-filter')?.value || '';

      const staff = (this._allStaffCache || []).filter(s => {
        const matchName = !q || (s.name && s.name.toLowerCase().includes(q)) || (s.matricule && s.matricule.toLowerCase().includes(q));
        const matchChu  = !chuFilter || (s.hospital_id === chuFilter);
        return matchName && matchChu;
      });

      const logs = (this._allLogsCache || []).filter(l => {
        const matchName = !q || (l.agentName && l.agentName.toLowerCase().includes(q)) || (l.matricule && l.matricule.toLowerCase().includes(q));
        const matchChu  = !chuFilter || (l.hospitalId === chuFilter);
        return matchName && matchChu;
      });

      const hint = document.getElementById('conn-counter-hint');
      if (hint) hint.textContent = `${staff.length} soignant(s) trouvé(s) · ${logs.length} événement(s)`;

      // Rendre Tableau Soignants
      const staffContainer = document.getElementById('conn-staff-table-container');
      if (staffContainer) {
        if (staff.length === 0) {
          staffContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#94a3b8;">Aucun soignant ne correspond aux critères.</div>';
        } else {
          staffContainer.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:0.83rem;">
              <thead>
                <tr style="background:#f1f5f9;color:#475569;text-align:left;border-bottom:1px solid #cbd5e1;">
                  <th style="padding:10px 12px;font-weight:700;">Professionnel de Santé</th>
                  <th style="padding:10px 12px;font-weight:700;">Rôle & Service</th>
                  <th style="padding:10px 12px;font-weight:700;">Établissement (CHU)</th>
                  <th style="padding:10px 12px;font-weight:700;">Dernière Connexion</th>
                  <th style="padding:10px 12px;font-weight:700;">Statut</th>
                  <th style="padding:10px 12px;font-weight:700;text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${staff.map(s => {
                  const cleanName = this.cleanAgentName(s.name);
                  const isActive  = s.is_active !== false;
                  let lastLoginDisplay = '<span class="conn-status-badge conn-status-offline">⚪ Jamais connecté</span>';
                  if (s.last_login) {
                    const dt = new Date(s.last_login);
                    const formatted = dt.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' }) + ' à ' + dt.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
                    lastLoginDisplay = `<span class="conn-status-badge conn-status-online" title="${s.last_login}">🟢 ${formatted}</span>`;
                  }
                  return `
                    <tr style="border-bottom:1px solid #e2e8f0;background:${isActive ? '#fff' : '#fcfcfc'};">
                      <td style="padding:10px 12px;">
                        <div style="font-weight:700;color:#0f172a;">${this.escapeHtml(cleanName)}</div>
                        <div style="font-size:0.73rem;color:#64748b;"><code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;">${this.escapeHtml(s.matricule || 'N/A')}</code></div>
                      </td>
                      <td style="padding:10px 12px;color:#334155;">
                        <div>${this.escapeHtml(s.title_label || s.role)}</div>
                        <div style="font-size:0.73rem;color:#64748b;">${this.escapeHtml(s.service || 'Soins généraux')}</div>
                      </td>
                      <td style="padding:10px 12px;color:#475569;font-weight:600;">
                        ${this.escapeHtml(s.hospital_name || s.hospital_id || 'CHU')}
                      </td>
                      <td style="padding:10px 12px;">
                        ${lastLoginDisplay}
                      </td>
                      <td style="padding:10px 12px;">
                        <span style="font-size:0.72rem;font-weight:700;padding:2px 8px;border-radius:12px;${isActive ? 'background:#dcfce7;color:#166534;' : 'background:#fee2e2;color:#991b1b;'}">
                          ${isActive ? 'Actif' : 'Désactivé'}
                        </span>
                      </td>
                      <td style="padding:10px 12px;text-align:right;">
                        <button onclick="window.AuthService.adminResetPassword('${s.id}','${this.escapeHtml(cleanName).replace(/'/g,"\\'")}')" style="padding:4px 8px;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;border-radius:6px;font-size:0.73rem;font-weight:600;cursor:pointer;margin-right:4px;">✏️ MDP</button>
                        <button onclick="window.AuthService.adminToggleActive('${s.id}',${isActive},'${this.escapeHtml(cleanName).replace(/'/g,"\\'")}')" style="padding:4px 8px;background:${isActive ? '#fef2f2' : '#f0fdf4'};border:1px solid ${isActive ? '#fca5a5' : '#86efac'};color:${isActive ? '#b91c1c' : '#15803d'};border-radius:6px;font-size:0.73rem;font-weight:600;cursor:pointer;">${isActive ? 'Désactiver' : 'Activer'}</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `;
        }
      }

      // Rendre Journal des Logs
      const logsContainer = document.getElementById('conn-logs-list-container');
      if (logsContainer) {
        if (logs.length === 0) {
          logsContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#94a3b8;">Aucun événement de connexion enregistré pour l\'instant. Les futures connexions des soignants apparaîtront ici automatiquement.</div>';
        } else {
          logsContainer.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${logs.map(l => {
                const isSuccess = l.status === 'SUCCESS';
                const isBlocked = l.status === 'BLOCKED';
                const badgeColor = isSuccess ? 'background:#dcfce7;color:#166534;border:1px solid #86efac;' : (isBlocked ? 'background:#fef3c7;color:#92400e;border:1px solid #fcd34d;' : 'background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;');
                const icon = isSuccess ? '🟢' : (isBlocked ? '🟡' : '🔴');
                return `
                  <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;background:#ffffff;gap:12px;">
                    <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
                      <span style="font-size:1.1rem;">${icon}</span>
                      <div style="min-width:0;">
                        <div style="font-weight:700;color:#0f172a;font-size:0.85rem;">
                          ${this.escapeHtml(l.agentName)} 
                          <span style="font-weight:400;color:#64748b;font-size:0.75rem;">(${this.escapeHtml(l.matricule || 'N/A')})</span>
                        </div>
                        <div style="font-size:0.74rem;color:#64748b;margin-top:2px;">
                          ${this.escapeHtml(l.role)} · ${this.escapeHtml(l.hospitalName)} · Poste : ${this.escapeHtml(l.device || 'Navigateur Web')}
                        </div>
                      </div>
                    </div>
                    <div style="text-align:right;white-space:nowrap;">
                      <span style="padding:2px 8px;border-radius:12px;font-size:0.72rem;font-weight:700;${badgeColor}">
                        ${this.escapeHtml(l.status)}
                      </span>
                      <div style="font-size:0.74rem;color:#64748b;margin-top:3px;">
                        ${this.escapeHtml(l.displayDate)} à ${this.escapeHtml(l.displayTime)}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `;
        }
      }
    }

    exportConnectionLogsCsv() {
      const logs = this.getLoginLogs();
      if (!logs || logs.length === 0) {
        alert("Aucun journal de connexion à exporter.");
        return;
      }
      let csv = "ID;Nom;Matricule;Role;Hopital;Service;Statut;Date;Heure;Appareil;Details\n";
      logs.forEach(l => {
        csv += `"${l.id}";"${l.agentName}";"${l.matricule}";"${l.role}";"${l.hospitalName}";"${l.service}";"${l.status}";"${l.displayDate}";"${l.displayTime}";"${l.device}";"${l.details}"\n`;
      });
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `journal_connexions_gab_sante_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    clearConnectionLogs() {
      if (confirm("Voulez-vous réinitialiser l'historique local des connexions ?")) {
        localStorage.removeItem('sani_agent_login_logs');
        this._allLogsCache = [];
        this.filterConnections();
      }
    }

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  }

  // Instanciation globale
  window.AuthService = new AuthService();

})(window);
