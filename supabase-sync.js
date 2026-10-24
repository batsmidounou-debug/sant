/**
 * GAB-SANTE - Synchronisation Cloud & Temps Réel Supabase (Santé-Gab)
 * Module : supabase-sync.js
 *
 * Fonctionnalités :
 * - Connexion sécurisée au projet Cloud Santé-Gab (bxvuvagcstsemxmlykyx)
 * - Synchronisation bidirectionnelle (Local-First + Cloud Realtime)
 * - Souscription temps réel (Postgres Changes) sur toutes les tables hospitalières
 * - Amorce initiale automatique si la base distante est vierge
 * - Mise à jour transparente de l'interface et notifications toast inter-postes
 * - Synchronisation complète : patients, CHU, prescriptions, transferts,
 *   télé-expertise, stocks sanguins, réquisitions CNTS, logs de lits
 */

(function(window) {
  'use strict';

  const SUPABASE_CONFIG = {
    url: 'https://bxvuvagcstsemxmlykyx.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4dnV2YWdjc3RzZW14bWx5a3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MTk2NzAsImV4cCI6MjEwNzQ5NTY3MH0.KDS3wMAPTaRY-9QSn0yRuMFmZCZGlq0PRJH2PlhEKIs',
    projectId: 'bxvuvagcstsemxmlykyx'
  };

  // ──────────────────────────────────────────────────────────────
  // Utilitaires de mapping (DB ↔ App)
  // ──────────────────────────────────────────────────────────────

  function mapPatientFromDB(row) {
    return {
      id: row.id,
      ins: row.ins,
      cnamgs: row.cnamgs,
      insurance: row.insurance,
      name: row.name,
      birthdate: row.birthdate,
      gender: row.gender,
      bloodType: row.blood_type,
      allergies: row.allergies || [],
      chronicDiseases: row.chronic_diseases || [],
      currentLocation: row.current_location,
      currentService: row.current_service,
      contacts: row.contacts,
      history: row.history || [],
      medicalHistory: row.medical_history || ''
    };
  }

  function mapPatientToDB(p) {
    return {
      id: p.id,
      ins: p.ins,
      cnamgs: p.cnamgs,
      insurance: p.insurance,
      name: p.name,
      birthdate: p.birthdate,
      gender: p.gender,
      blood_type: p.bloodType,
      allergies: p.allergies || [],
      chronic_diseases: p.chronicDiseases || [],
      current_location: p.currentLocation,
      current_service: p.currentService,
      contacts: p.contacts,
      history: p.history || [],
      medical_history: p.medicalHistory || ''
    };
  }

  function mapTransferFromDB(row) {
    return {
      id: row.id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      fromChu: row.from_chu,
      toChu: row.to_chu,
      chuName: row.chu_name,
      destName: row.dest_name,
      reason: row.reason,
      priority: row.priority,
      priorityClass: row.priority_class,
      status: row.status,
      statusClass: row.status_class,
      date: row.date,
      time: row.time,
      patientBloodType: row.patient_blood_type,
      notes: row.notes,
      doctor: row.doctor
    };
  }

  function mapTransferToDB(t) {
    return {
      id: t.id,
      patient_id: t.patientId,
      patient_name: t.patientName,
      from_chu: t.fromChu,
      to_chu: t.toChu,
      chu_name: t.chuName,
      dest_name: t.destName,
      reason: t.reason,
      priority: t.priority,
      priority_class: t.priorityClass,
      status: t.status,
      status_class: t.statusClass,
      date: t.date,
      time: t.time,
      patient_blood_type: t.patientBloodType,
      notes: t.notes,
      doctor: t.doctor
    };
  }

  function mapPrescriptionFromDB(row) {
    return {
      id: row.id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      chuKey: row.chu_key,
      chuName: row.chu_name,
      doctor: row.doctor,
      onmg: row.onmg,
      service: row.service,
      insuranceKey: row.insurance_key,
      insuranceName: row.insurance_name,
      weight: row.weight,
      isAld: row.is_ald,
      medications: row.medications || [],
      notes: row.notes,
      dateText: row.date_text
    };
  }

  function mapPrescriptionToDB(p) {
    return {
      id: p.id,
      patient_id: p.patientId,
      patient_name: p.patientName,
      chu_key: p.chuKey,
      chu_name: p.chuName,
      doctor: p.doctor,
      onmg: p.onmg,
      service: p.service,
      insurance_key: p.insuranceKey,
      insurance_name: p.insuranceName,
      weight: p.weight || null,
      is_ald: Boolean(p.isAld),
      medications: p.medications || [],
      notes: p.notes || '',
      date_text: p.dateText
    };
  }

  function mapTeleExpertiseFromDB(row) {
    return {
      id: row.id,
      title: row.title,
      patientId: row.patient_id,
      patientName: row.patient_name,
      fromChu: row.from_chu,
      toChu: row.to_chu,
      status: row.status,
      statusClass: row.status_class,
      urgency: row.urgency,
      date: row.date,
      notes: row.notes,
      history: row.history || [],
      requestedBy: row.requested_by,
      requestType: row.request_type,
      specialty: row.specialty,
      question: row.question,
      response: row.response,
      responseDoctor: row.response_doctor,
      responseDate: row.response_date
    };
  }

  function mapTeleExpertiseToDB(r) {
    return {
      id: r.id,
      title: r.title,
      patient_id: r.patientId,
      patient_name: r.patientName,
      from_chu: r.fromChu,
      to_chu: r.toChu,
      status: r.status,
      status_class: r.statusClass,
      urgency: r.urgency,
      date: r.date,
      notes: r.notes,
      history: r.history || [],
      requested_by: r.requestedBy,
      request_type: r.requestType,
      specialty: r.specialty,
      question: r.question,
      response: r.response,
      response_doctor: r.responseDoctor,
      response_date: r.responseDate
    };
  }

  function mapCntsRequisitionFromDB(row) {
    return {
      id: row.id,
      chuId: row.chu_id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      bloodType: row.blood_type,
      urgency: row.urgency,
      quantity: row.quantity,
      indication: row.indication,
      date: row.date,
      time: row.time,
      qrData: row.qr_data,
      doctor: row.doctor,
      onmg: row.onmg,
      service: row.service
    };
  }

  function mapCntsRequisitionToDB(r) {
    return {
      id: r.id,
      chu_id: r.chuId,
      patient_id: r.patientId,
      patient_name: r.patientName,
      blood_type: r.bloodType,
      urgency: r.urgency,
      quantity: r.quantity,
      indication: r.indication,
      date: r.date,
      time: r.time,
      qr_data: r.qrData,
      doctor: r.doctor,
      onmg: r.onmg,
      service: r.service
    };
  }

  function mapBedLogFromDB(row) {
    return {
      id: row.id,
      date: row.date,
      time: row.time,
      chuId: row.chu_id,
      action: row.action,
      details: row.details,
      operator: row.operator,
      bedsBefore: row.beds_before,
      bedsAfter: row.beds_after
    };
  }

  function mapBedLogToDB(l) {
    return {
      id: l.id,
      date: l.date,
      time: l.time,
      chu_id: l.chuId,
      action: l.action,
      details: l.details,
      operator: l.operator,
      beds_before: l.bedsBefore,
      beds_after: l.bedsAfter
    };
  }

  function mapEpidemicAlertFromDB(row) {
    return {
      id: row.id,
      disease: row.disease,
      diseaseCode: row.disease_code,
      province: row.province,
      chuId: row.chu_id,
      suspectedCases: row.suspected_cases,
      confirmedCases: row.confirmed_cases,
      deaths: row.deaths,
      alertLevel: row.alert_level,
      status: row.status,
      patientId: row.patient_id,
      patientName: row.patient_name,
      doctorNotifier: row.doctor_notifier,
      onmgNumber: row.onmg_number,
      notes: row.notes,
      investigationDate: row.investigation_date,
      omsNotified: row.oms_notified,
      createdAt: row.created_at
    };
  }

  function mapEpidemicAlertToDB(a) {
    return {
      id: a.id,
      disease: a.disease,
      disease_code: a.diseaseCode,
      province: a.province,
      chu_id: a.chuId,
      suspected_cases: a.suspectedCases,
      confirmed_cases: a.confirmedCases,
      deaths: a.deaths,
      alert_level: a.alertLevel,
      status: a.status,
      patient_id: a.patientId,
      patient_name: a.patientName,
      doctor_notifier: a.doctorNotifier,
      onmg_number: a.onmgNumber,
      notes: a.notes,
      investigation_date: a.investigationDate,
      oms_notified: Boolean(a.omsNotified)
    };
  }

  // ──────────────────────────────────────────────────────────────
  // Classe principale de synchronisation
  // ──────────────────────────────────────────────────────────────

  class SupabaseSyncService {
    constructor() {
      this.client = null;
      this.isConnected = false;
      this.isSyncing = false;
      this.channels = [];
      this.app = null;
    }

    /**
     * Initialise le client Supabase et configure la synchronisation temps réel
     */
    async init(appInstance) {
      this.app = appInstance || window.saniApp;

      if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        console.warn('[GAB-SANTE Cloud] Bibliothèque Supabase JS non disponible.');
        this.updateBadge(false, 'Bibliothèque indisponible');
        return false;
      }

      try {
        this.client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
          auth: { persistSession: false },
          realtime: { params: { eventsPerSecond: 10 } }
        });

        // Test de ping vers Supabase
        const { error } = await this.client.from('sani_patients').select('id').limit(1);
        if (error) {
          console.warn('[GAB-SANTE Cloud] Connexion partielle à Supabase :', error.message);
          this.updateBadge(false, 'Connexion restreinte');
          return false;
        }

        this.isConnected = true;
        this.updateBadge(true, 'Connecté (Temps Réel)');
        console.log('[GAB-SANTE Cloud] ✅ Connecté avec succès au projet Cloud Santé-Gab !');

        // 1. Initialiser les données si la base Cloud est encore vide
        await this.bootstrapCloudDataIfEmpty();

        // 2. Charger les données distantes les plus récentes
        await this.pullAllDataFromCloud();

        // 3. Activer l'écoute des modifications en temps réel
        this.setupRealtimeListeners();

        return true;
      } catch (err) {
        console.error('[GAB-SANTE Cloud] Erreur initialisation Supabase :', err);
        this.updateBadge(false, 'Erreur connexion');
        return false;
      }
    }

    /**
     * Met à jour le voyant de statut dans l'interface
     */
    updateBadge(online, text) {
      const topBadge = document.getElementById('cloud-sync-status-badge');
      if (topBadge) {
        topBadge.innerHTML = online 
          ? `<span style="color:#10b981;">●</span> Santé-Gab Cloud : Connecté`
          : `<span style="color:#ef4444;">○</span> Santé-Gab Cloud : Hors-ligne`;
        topBadge.style.color = online ? '#065f46' : '#991b1b';
        topBadge.style.background = online ? '#ecfdf5' : '#fef2f2';
        topBadge.style.borderColor = online ? '#a7f3d0' : '#fecaca';
      }

      const cloudStatusEl = document.getElementById('cloud-sync-status-text');
      if (cloudStatusEl) {
        cloudStatusEl.innerHTML = online 
          ? `<strong style="color:#059669;">● Connecté en temps réel (Santé-Gab)</strong>`
          : `<span style="color:#dc2626;">○ Déconnecté</span>`;
      }
    }

    /**
     * Amorce automatique : Si les tables Cloud sont vierges, injecte les données locales initiales
     */
    async bootstrapCloudDataIfEmpty() {
      if (!this.client || !this.app) return;

      try {
        const { count, error } = await this.client.from('sani_patients').select('id', { count: 'exact', head: true });
        if (!error && (count === 0 || count === null)) {
          console.log('[GAB-SANTE Cloud] Base distante vide. Amorce initiale des données gabonaises...');
          await this.pushAllLocalDataToCloud();
          if (this.app.showToast) {
            this.app.showToast('🚀 Base Cloud Santé-Gab initialisée avec succès !');
          }
        }
      } catch (e) {
        console.warn('[GAB-SANTE Cloud] Erreur bootstrap :', e);
      }
    }

    /**
     * Envoie toutes les données locales vers le Cloud Supabase
     */
    async pushAllLocalDataToCloud() {
      if (!this.client || !this.app) return;

      this.isSyncing = true;
      try {
        // 1. Établissements CHU
        const chuList = Object.values(this.app.chuStatus || {}).map(c => ({
          id: c.id,
          name: c.name,
          short_name: c.shortName,
          location: c.location,
          pole: c.pole,
          total_beds: c.totalBeds || 0,
          occupied_beds: c.occupiedBeds || 0,
          rea_beds: c.reaBeds || 0,
          rea_occupied: c.reaOccupied || 0,
          director: c.director,
          phone: c.phone,
          emergency_phone: c.emergencyPhone,
          color: c.color,
          tag_class: c.tagClass,
          is_default: Boolean(c.isDefault),
          specialties: c.specialties || [],
          coords: c.coords || {}
        }));
        if (chuList.length > 0) {
          await this.client.from('sani_chu_status').upsert(chuList, { onConflict: 'id' });
        }

        // 2. Patients DMP
        const patientsList = (this.app.patients || []).map(mapPatientToDB);
        if (patientsList.length > 0) {
          await this.client.from('sani_patients').upsert(patientsList, { onConflict: 'id' });
        }

        // 3. Transferts SAMU
        const trfList = (this.app.transfers || []).map(mapTransferToDB);
        if (trfList.length > 0) {
          await this.client.from('sani_transfers').upsert(trfList, { onConflict: 'id' });
        }

        // 4. Ordonnances Médicales
        const ordoList = (this.app.prescriptions || []).map(mapPrescriptionToDB);
        if (ordoList.length > 0) {
          await this.client.from('sani_prescriptions').upsert(ordoList, { onConflict: 'id' });
        }

        // 5. Télé-Expertise / RCP
        const rcpSource = this.app.teleExpertise || this.app.rcpList || [];
        const rcpList = rcpSource.map(mapTeleExpertiseToDB);
        if (rcpList.length > 0) {
          await this.client.from('sani_tele_expertise').upsert(rcpList, { onConflict: 'id' });
        }

        // 6. Stocks Sanguins (par CHU)
        const bloodEntries = Object.entries(this.app.bloodStocks || {}).map(([chuId, stocks]) => ({
          chu_id: chuId,
          stocks: stocks,
          updated_at: new Date().toISOString()
        }));
        if (bloodEntries.length > 0) {
          await this.client.from('sani_blood_stocks').upsert(bloodEntries, { onConflict: 'chu_id' });
        }

        // 7. Réquisitions CNTS
        const cntsSource = this.app.cntsRequisitions || this.app.bloodRequests || [];
        const cntsList = cntsSource.map(mapCntsRequisitionToDB);
        if (cntsList.length > 0) {
          await this.client.from('sani_cnts_requisitions').upsert(cntsList, { onConflict: 'id' });
        }

        // 8. Logs de lits
        const bedLogSource = this.app.bedLogs || [];
        const bedLogList = bedLogSource.map(mapBedLogToDB);
        if (bedLogList.length > 0) {
          await this.client.from('sani_bed_logs').upsert(bedLogList, { onConflict: 'id' });
        }

        // 9. Alertes Épidémiologiques (DGS / OMS)
        const epiSource = (window.saniEpidemio && window.saniEpidemio.alerts) ? window.saniEpidemio.alerts : [];
        const epiList = epiSource.map(mapEpidemicAlertToDB);
        if (epiList.length > 0) {
          await this.client.from('sani_epidemic_alerts').upsert(epiList, { onConflict: 'id' });
        }

        console.log('[GAB-SANTE Cloud] ✅ Toutes les données locales synchronisées vers le Cloud !');
      } catch (err) {
        console.error('[GAB-SANTE Cloud] Erreur lors de l\'envoi vers le Cloud :', err);
      } finally {
        this.isSyncing = false;
      }
    }

    /**
     * Récupère toutes les données du Cloud Supabase et rafraîchit l'application locale
     */
    async pullAllDataFromCloud() {
      if (!this.client || !this.app) return;

      try {
        // 1. Patients
        const { data: cloudPatients, error: pErr } = await this.client.from('sani_patients').select('*');
        if (!pErr && cloudPatients && cloudPatients.length > 0) {
          this.app.patients = cloudPatients.map(mapPatientFromDB);
          this.app.saveData('sani_patients', this.app.patients, true);
        }

        // 2. CHU Status & Lits
        const { data: cloudChus, error: cErr } = await this.client.from('sani_chu_status').select('*');
        if (!cErr && cloudChus && cloudChus.length > 0) {
          cloudChus.forEach(c => {
            if (this.app.chuStatus[c.id]) {
              this.app.chuStatus[c.id].totalBeds = c.total_beds;
              this.app.chuStatus[c.id].occupiedBeds = c.occupied_beds;
              this.app.chuStatus[c.id].reaBeds = c.rea_beds;
              this.app.chuStatus[c.id].reaOccupied = c.rea_occupied;
              if (c.name) this.app.chuStatus[c.id].name = c.name;
              if (c.short_name) this.app.chuStatus[c.id].shortName = c.short_name;
              if (c.director) this.app.chuStatus[c.id].director = c.director;
            } else {
              const preset = (window.PRESET_HOSPITALS && window.PRESET_HOSPITALS[c.id]) || (window.CHU_DATA && window.CHU_DATA[c.id]) || {};
              this.app.chuStatus[c.id] = {
                id: c.id,
                name: c.name || preset.name || c.id,
                shortName: c.short_name || preset.shortName || c.name || c.id,
                location: c.location || preset.location || 'Gabon',
                pole: c.pole || preset.pole || 'Pôle Médical',
                totalBeds: c.total_beds || preset.totalBeds || 100,
                occupiedBeds: c.occupied_beds || preset.occupiedBeds || 50,
                reaBeds: c.rea_beds || preset.reaBeds || 10,
                reaOccupied: c.rea_occupied || preset.reaOccupied || 4,
                director: c.director || preset.director || 'Directeur Médical',
                phone: c.phone || preset.phone || '+241 (0)11 00 00 00',
                emergencyPhone: c.emergency_phone || preset.emergencyPhone || '1300',
                color: c.color || preset.color || '#0284c7',
                tagClass: c.tag_class || preset.tagClass || 'tag-chul',
                isDefault: Boolean(c.is_default),
                specialties: c.specialties || preset.specialties || [],
                coords: c.coords || preset.coords || { x: 400, y: 300 }
              };
            }
          });
          this.app.saveData('sani_chu_status', this.app.chuStatus, true);
        }

        // 3. Ordonnances
        const { data: cloudOrdos, error: oErr } = await this.client.from('sani_prescriptions').select('*');
        if (!oErr && cloudOrdos && cloudOrdos.length > 0) {
          this.app.prescriptions = cloudOrdos.map(mapPrescriptionFromDB);
          this.app.saveData('sani_prescriptions', this.app.prescriptions, true);
        }

        // 4. Transferts
        const { data: cloudTransfers, error: tErr } = await this.client.from('sani_transfers').select('*');
        if (!tErr && cloudTransfers && cloudTransfers.length > 0) {
          this.app.transfers = cloudTransfers.map(mapTransferFromDB);
          this.app.saveData('sani_transfers', this.app.transfers, true);
        }

        // 5. Télé-Expertise / RCP
        const { data: cloudRcp, error: rErr } = await this.client.from('sani_tele_expertise').select('*');
        if (!rErr && cloudRcp && cloudRcp.length > 0) {
          const mapped = cloudRcp.map(mapTeleExpertiseFromDB);
          if (this.app.teleExpertise !== undefined) this.app.teleExpertise = mapped;
          else if (this.app.rcpList !== undefined) this.app.rcpList = mapped;
          this.app.saveData('sani_rcp', mapped, true);
        }

        // 6. Stocks Sanguins
        const { data: cloudBlood, error: bErr } = await this.client.from('sani_blood_stocks').select('*');
        if (!bErr && cloudBlood && cloudBlood.length > 0) {
          cloudBlood.forEach(row => {
            if (this.app.bloodStocks) {
              this.app.bloodStocks[row.chu_id] = row.stocks;
            }
          });
          this.app.saveData('sani_blood', this.app.bloodStocks, true);
        }

        // 7. Réquisitions CNTS
        const { data: cloudCnts, error: cntsErr } = await this.client.from('sani_cnts_requisitions').select('*');
        if (!cntsErr && cloudCnts && cloudCnts.length > 0) {
          const mappedCnts = cloudCnts.map(mapCntsRequisitionFromDB);
          if (this.app.cntsRequisitions !== undefined) this.app.cntsRequisitions = mappedCnts;
          else if (this.app.bloodRequests !== undefined) this.app.bloodRequests = mappedCnts;
          this.app.saveData('sani_cnts_requisitions', mappedCnts, true);
        }

        // 8. Logs de Lits (limité aux 500 derniers)
        const { data: cloudBedLogs, error: blErr } = await this.client
          .from('sani_bed_logs').select('*')
          .order('created_at', { ascending: false })
          .limit(500);
        if (!blErr && cloudBedLogs && cloudBedLogs.length > 0) {
          const mappedLogs = cloudBedLogs.map(mapBedLogFromDB);
          if (this.app.bedLogs !== undefined) this.app.bedLogs = mappedLogs;
          this.app.saveData('sani_bed_logs', mappedLogs, true);
        }

        // 9. Alertes Épidémiologiques (DGS / OMS)
        const { data: cloudEpi, error: epiErr } = await this.client.from('sani_epidemic_alerts').select('*');
        if (!epiErr && cloudEpi && cloudEpi.length > 0) {
          const mappedEpi = cloudEpi.map(mapEpidemicAlertFromDB);
          if (window.saniEpidemio) {
            window.saniEpidemio.alerts = mappedEpi;
          }
          this.app.saveData('sani_epialerts', mappedEpi, true);
        }

        // Rafraîchir l'affichage actif
        if (this.app.refreshAllChuSelects) this.app.refreshAllChuSelects();
        if (this.app.updateLiveStats) this.app.updateLiveStats();
        if (this.app.renderCurrentView) this.app.renderCurrentView();

        console.log('[GAB-SANTE Cloud] ✅ Données distantes synchronisées en local avec succès.');
      } catch (err) {
        console.error('[GAB-SANTE Cloud] Erreur chargement depuis le Cloud :', err);
      }
    }

    /**
     * Active les écouteurs Realtime (Postgres Changes) sur toutes les tables
     */
    setupRealtimeListeners() {
      if (!this.client || !this.app) return;

      // Écoute des patients
      this.client
        .channel('realtime:patients')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sani_patients' }, (payload) => {
          this.handleRealtimePatient(payload);
        })
        .subscribe();

      // Écoute des lits / CHU
      this.client
        .channel('realtime:chu_status')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sani_chu_status' }, (payload) => {
          this.handleRealtimeChuStatus(payload);
        })
        .subscribe();

      // Écoute des ordonnances
      this.client
        .channel('realtime:prescriptions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sani_prescriptions' }, (payload) => {
          this.handleRealtimePrescription(payload);
        })
        .subscribe();

      // Écoute des transferts SAMU
      this.client
        .channel('realtime:transfers')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sani_transfers' }, (payload) => {
          this.handleRealtimeTransfer(payload);
        })
        .subscribe();

      // Écoute des demandes de Télé-Expertise
      this.client
        .channel('realtime:tele_expertise')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sani_tele_expertise' }, (payload) => {
          this.handleRealtimeTeleExpertise(payload);
        })
        .subscribe();

      // Écoute des stocks sanguins
      this.client
        .channel('realtime:blood_stocks')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sani_blood_stocks' }, (payload) => {
          this.handleRealtimeBloodStocks(payload);
        })
        .subscribe();

      // Écoute des réquisitions CNTS
      this.client
        .channel('realtime:cnts_requisitions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sani_cnts_requisitions' }, (payload) => {
          this.handleRealtimeCntsRequisition(payload);
        })
        .subscribe();

      // Écoute des alertes épidémiologiques (DGS / OMS)
      this.client
        .channel('realtime:epidemic_alerts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sani_epidemic_alerts' }, (payload) => {
          this.handleRealtimeEpidemicAlert(payload);
        })
        .subscribe();

      console.log('[GAB-SANTE Cloud] 🔴 Écouteurs Realtime activés — 8 canaux ouverts pour les CHU du Gabon.');
    }

    // ──────────────────────────────────────────────────────────────
    // Gestionnaires Realtime
    // ──────────────────────────────────────────────────────────────

    handleRealtimePatient(payload) {
      if (this.isSyncing) return;
      const { eventType, new: newRow, old: oldRow } = payload;
      console.log('[GAB-SANTE Realtime] Événement patient :', eventType, newRow?.id || oldRow?.id);

      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        const mapped = mapPatientFromDB(newRow);
        const idx = this.app.patients.findIndex(p => p.id === mapped.id);
        if (idx !== -1) {
          this.app.patients[idx] = mapped;
        } else {
          this.app.patients.unshift(mapped);
          console.log(`[GAB-SANTE Realtime] Patient reçu silencieusement : ${mapped.name}`);
        }
        this.app.saveData('sani_patients', this.app.patients, true);
        if (this.app.renderCurrentView) this.app.renderCurrentView();
        if (this.app.updateLiveStats) this.app.updateLiveStats();
      } else if (eventType === 'DELETE') {
        this.app.patients = this.app.patients.filter(p => p.id !== oldRow.id);
        this.app.saveData('sani_patients', this.app.patients, true);
        if (this.app.renderCurrentView) this.app.renderCurrentView();
        if (this.app.updateLiveStats) this.app.updateLiveStats();
      }
    }

    handleRealtimeChuStatus(payload) {
      if (this.isSyncing) return;
      const { new: row } = payload;
      if (!row) return;

      if (!this.app.chuStatus[row.id]) {
        const preset = (window.PRESET_HOSPITALS && window.PRESET_HOSPITALS[row.id]) || (window.CHU_DATA && window.CHU_DATA[row.id]) || {};
        this.app.chuStatus[row.id] = {
          id: row.id,
          name: row.name || preset.name || row.id,
          shortName: row.short_name || preset.shortName || row.name || row.id,
          location: row.location || preset.location || 'Gabon',
          pole: row.pole || preset.pole || 'Pôle Médical',
          totalBeds: row.total_beds || preset.totalBeds || 100,
          occupiedBeds: row.occupied_beds || preset.occupiedBeds || 50,
          reaBeds: row.rea_beds || preset.reaBeds || 10,
          reaOccupied: row.rea_occupied || preset.reaOccupied || 4,
          director: row.director || preset.director || 'Directeur Médical',
          phone: row.phone || preset.phone || '+241 (0)11 00 00 00',
          emergencyPhone: row.emergency_phone || preset.emergencyPhone || '1300',
          color: row.color || preset.color || '#0284c7',
          tagClass: row.tag_class || preset.tagClass || 'tag-chul',
          isDefault: Boolean(row.is_default),
          specialties: row.specialties || preset.specialties || [],
          coords: row.coords || preset.coords || { x: 400, y: 300 }
        };
      } else {
        this.app.chuStatus[row.id].occupiedBeds = row.occupied_beds;
        this.app.chuStatus[row.id].totalBeds = row.total_beds;
        this.app.chuStatus[row.id].reaOccupied = row.rea_occupied;
        this.app.chuStatus[row.id].reaBeds = row.rea_beds;
        if (row.name) this.app.chuStatus[row.id].name = row.name;
        if (row.short_name) this.app.chuStatus[row.id].shortName = row.short_name;
      }

      this.app.saveData('sani_chu_status', this.app.chuStatus, true);
      if (this.app.refreshAllChuSelects) this.app.refreshAllChuSelects();
      if (this.app.updateLiveStats) this.app.updateLiveStats();
      if (this.app.currentView === 'overview' && this.app.renderOverview) {
        this.app.renderOverview();
      }
    }

    handleRealtimePrescription(payload) {
      if (this.isSyncing) return;
      const { eventType, new: newRow, old: oldRow } = payload;
      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        const mapped = mapPrescriptionFromDB(newRow);
        const idx = this.app.prescriptions.findIndex(o => o.id === mapped.id);
        if (idx !== -1) {
          this.app.prescriptions[idx] = mapped;
        } else {
          this.app.prescriptions.unshift(mapped);
          console.log(`[GAB-SANTE Realtime] Ordonnance reçue silencieusement : ${mapped.id}`);
        }
        this.app.saveData('sani_prescriptions', this.app.prescriptions, true);
      } else if (eventType === 'DELETE') {
        this.app.prescriptions = this.app.prescriptions.filter(o => o.id !== oldRow.id);
        this.app.saveData('sani_prescriptions', this.app.prescriptions, true);
      }
    }

    handleRealtimeTransfer(payload) {
      if (this.isSyncing) return;
      const { eventType, new: newRow, old: oldRow } = payload;
      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        const mapped = mapTransferFromDB(newRow);
        const idx = this.app.transfers.findIndex(t => t.id === mapped.id);
        if (idx !== -1) {
          this.app.transfers[idx] = mapped;
        } else {
          this.app.transfers.unshift(mapped);
          console.log(`[GAB-SANTE Realtime] Transfert reçu silencieusement : ${mapped.patientName}`);
        }
        this.app.saveData('sani_transfers', this.app.transfers, true);
        if (this.app.updateLiveStats) this.app.updateLiveStats();
        if (this.app.currentView === 'transfers' && this.app.renderTransfers) {
          this.app.renderTransfers();
        }
      } else if (eventType === 'DELETE') {
        this.app.transfers = this.app.transfers.filter(t => t.id !== oldRow.id);
        this.app.saveData('sani_transfers', this.app.transfers, true);
      }
    }

    handleRealtimeTeleExpertise(payload) {
      if (this.isSyncing) return;
      const { eventType, new: newRow, old: oldRow } = payload;
      const store = this.app.teleExpertise || this.app.rcpList;
      if (!store) return;

      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        const mapped = mapTeleExpertiseFromDB(newRow);
        const idx = store.findIndex(r => r.id === mapped.id);
        if (idx !== -1) {
          store[idx] = mapped;
        } else {
          store.unshift(mapped);
          console.log(`[GAB-SANTE Realtime] Télé-expertise reçue silencieusement : ${mapped.title}`);
        }
        this.app.saveData('sani_rcp', store, true);
        if (this.app.renderCurrentView) this.app.renderCurrentView();
      } else if (eventType === 'DELETE') {
        const filtered = store.filter(r => r.id !== oldRow.id);
        if (this.app.teleExpertise !== undefined) this.app.teleExpertise = filtered;
        else if (this.app.rcpList !== undefined) this.app.rcpList = filtered;
        this.app.saveData('sani_rcp', filtered, true);
      }
    }

    handleRealtimeBloodStocks(payload) {
      if (this.isSyncing) return;
      const { new: row } = payload;
      if (!row) return;

      if (this.app.bloodStocks) {
        this.app.bloodStocks[row.chu_id] = row.stocks;
        this.app.saveData('sani_blood', this.app.bloodStocks, true);
        console.log(`[GAB-SANTE Realtime] Stocks sanguins mis à jour : ${row.chu_id}`);
        if (this.app.renderCurrentView) this.app.renderCurrentView();
      }
    }

    handleRealtimeCntsRequisition(payload) {
      if (this.isSyncing) return;
      const { eventType, new: newRow, old: oldRow } = payload;
      const store = this.app.cntsRequisitions || this.app.bloodRequests;
      if (!store) return;

      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        const mapped = mapCntsRequisitionFromDB(newRow);
        const idx = store.findIndex(r => r.id === mapped.id);
        if (idx !== -1) {
          store[idx] = mapped;
        } else {
          store.unshift(mapped);
          console.log(`[GAB-SANTE Realtime] Réquisition CNTS reçue silencieusement : ${mapped.patientName}`);
        }
        this.app.saveData('sani_cnts_requisitions', store, true);
      } else if (eventType === 'DELETE') {
        const filtered = store.filter(r => r.id !== oldRow.id);
        if (this.app.cntsRequisitions !== undefined) this.app.cntsRequisitions = filtered;
        else if (this.app.bloodRequests !== undefined) this.app.bloodRequests = filtered;
        this.app.saveData('sani_cnts_requisitions', filtered, true);
      }
    }

    handleRealtimeEpidemicAlert(payload) {
      if (this.isSyncing) return;
      const { eventType, new: newRow, old: oldRow } = payload;
      if (!window.saniEpidemio) return;

      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        const mapped = mapEpidemicAlertFromDB(newRow);
        const idx = window.saniEpidemio.alerts.findIndex(a => a.id === mapped.id);
        if (idx !== -1) {
          window.saniEpidemio.alerts[idx] = mapped;
        } else {
          window.saniEpidemio.alerts.unshift(mapped);
          console.log(`[GAB-SANTE Realtime] Alerte épidémio reçue silencieusement : ${mapped.disease} (${mapped.province})`);
        }
        this.app.saveData('sani_epialerts', window.saniEpidemio.alerts, true);
        if (this.app.currentView === 'stats') {
          window.saniEpidemio.renderDashboard();
        }
      } else if (eventType === 'DELETE') {
        window.saniEpidemio.alerts = window.saniEpidemio.alerts.filter(a => a.id !== oldRow.id);
        this.app.saveData('sani_epialerts', window.saniEpidemio.alerts, true);
        if (this.app.currentView === 'stats') {
          window.saniEpidemio.renderDashboard();
        }
      }
    }

    // ──────────────────────────────────────────────────────────────
    // Méthodes de synchronisation individuelle (appel depuis app.js)
    // ──────────────────────────────────────────────────────────────

    async syncPatient(patient) {
      if (!this.client || !this.isConnected || !patient) return;
      try {
        await this.client.from('sani_patients').upsert(mapPatientToDB(patient), { onConflict: 'id' });
      } catch (e) {
        console.warn('[GAB-SANTE Cloud] Échec sync patient :', e);
      }
    }

    async syncPrescription(p) {
      if (!this.client || !this.isConnected || !p) return;
      try {
        await this.client.from('sani_prescriptions').upsert(mapPrescriptionToDB(p), { onConflict: 'id' });
      } catch (e) {
        console.warn('[GAB-SANTE Cloud] Échec sync prescription :', e);
      }
    }

    async syncTransfer(t) {
      if (!this.client || !this.isConnected || !t) return;
      try {
        await this.client.from('sani_transfers').upsert(mapTransferToDB(t), { onConflict: 'id' });
      } catch (e) {
        console.warn('[GAB-SANTE Cloud] Échec sync transfer :', e);
      }
    }

    async syncTeleExpertise(r) {
      if (!this.client || !this.isConnected || !r) return;
      try {
        await this.client.from('sani_tele_expertise').upsert(mapTeleExpertiseToDB(r), { onConflict: 'id' });
      } catch (e) {
        console.warn('[GAB-SANTE Cloud] Échec sync télé-expertise :', e);
      }
    }

    async syncBloodStocks(chuId, stocks) {
      if (!this.client || !this.isConnected || !chuId) return;
      try {
        await this.client.from('sani_blood_stocks').upsert({
          chu_id: chuId,
          stocks: stocks,
          updated_at: new Date().toISOString()
        }, { onConflict: 'chu_id' });
      } catch (e) {
        console.warn('[GAB-SANTE Cloud] Échec sync stocks sanguins :', e);
      }
    }

    async syncCntsRequisition(r) {
      if (!this.client || !this.isConnected || !r) return;
      try {
        await this.client.from('sani_cnts_requisitions').upsert(mapCntsRequisitionToDB(r), { onConflict: 'id' });
      } catch (e) {
        console.warn('[GAB-SANTE Cloud] Échec sync réquisition CNTS :', e);
      }
    }

    async syncBedLog(log) {
      if (!this.client || !this.isConnected || !log) return;
      try {
        await this.client.from('sani_bed_logs').upsert(mapBedLogToDB(log), { onConflict: 'id' });
      } catch (e) {
        console.warn('[GAB-SANTE Cloud] Échec sync log lits :', e);
      }
    }

    async syncEpidemicAlerts(alertsList) {
      if (!this.client || !this.isConnected || !alertsList) return;
      try {
        const mapped = alertsList.map(mapEpidemicAlertToDB);
        if (mapped.length > 0) {
          await this.client.from('sani_epidemic_alerts').upsert(mapped, { onConflict: 'id' });
        }
      } catch (e) {
        console.warn('[GAB-SANTE Cloud] Échec sync alertes épidémio :', e);
      }
    }

    /**
     * Sauvegarde immédiate de la capacité des lits d'un CHU dans le Cloud
     */
    async syncChuStatus(chuId, chu) {
      if (!this.client || !this.isConnected || !chu) return;
      try {
        await this.client.from('sani_chu_status').upsert({
          id: chuId,
          name: chu.name,
          short_name: chu.shortName,
          location: chu.location,
          pole: chu.pole,
          total_beds: chu.totalBeds || 0,
          occupied_beds: chu.occupiedBeds || 0,
          rea_beds: chu.reaBeds || 0,
          rea_occupied: chu.reaOccupied || 0,
          director: chu.director,
          phone: chu.phone,
          emergency_phone: chu.emergencyPhone,
          color: chu.color,
          tag_class: chu.tagClass,
          is_default: Boolean(chu.isDefault),
          specialties: chu.specialties || [],
          coords: chu.coords || {}
        }, { onConflict: 'id' });
      } catch (e) {
        console.warn('[GAB-SANTE Cloud] Échec sync lits CHU :', e);
      }
    }

    /**
     * Déconnexion propre (ferme tous les canaux Realtime)
     */
    disconnect() {
      if (this.client) {
        this.client.removeAllChannels();
        console.log('[GAB-SANTE Cloud] Canaux Realtime fermés.');
      }
      this.isConnected = false;
      this.updateBadge(false, 'Déconnecté');
    }
  }

  // Exposition globale
  window.SupabaseSyncService = new SupabaseSyncService();

})(window);
