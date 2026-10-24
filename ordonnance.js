/**
 * GAB-SANTE - Module des Fiches d'Ordonnance Médicale par Assurance Maladie
 * Génération certifiée d'ordonnances adaptées aux régimes gabonais :
 * - CNAMGS (Fonctionnaires, PVNR, Secteur Privé, TIS, Étudiants)
 * - CNSS (Risques Professionnels, Accidents du Travail)
 * - Mutuelles Professionnelles (MEN, Santé, FAG, Pétrole)
 * - Compagnies Privées avec Tiers-Payant (ASCOMA, OGAR, AXA, Sanlam)
 * - Ordonnance Hospitalière Standard (CHU de référence)
 * 
 * Intègre la traçabilité par QR Code, contrôle des allergies,
 * zone dédiée à la signature manuscrite du docteur et cadre officine.
 */

const OrdonnanceService = {
  currentPrescription: null,

  /**
   * Génère le document HTML de l'ordonnance médicale selon l'assurance
   */
  generateHtml(prescription, patient, chu, insurance) {
    this.currentPrescription = prescription;
    const now = new Date(prescription.createdAt || prescription.date || new Date());
    const dateFormatted = prescription.dateText || now.toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    // Résolution robuste de l'assurance
    let ins = insurance;
    if (!ins && window.INSURANCE_LIST) {
      const insKey = prescription.insuranceKey || prescription.insuranceCode;
      if (insKey && window.INSURANCE_LIST[insKey]) {
        ins = window.INSURANCE_LIST[insKey];
      }
    }
    if (!ins) {
      ins = {
        code: prescription.insuranceCode || 'CNAMGS-FONC',
        label: 'CNAMGS Fonctionnaires',
        shortLabel: 'CNAMGS',
        group: 'public',
        logo: '🏛️',
        coverageRate: '80%',
        copay: '20%',
        color: '#0072ce'
      };
    }

    const insCode = ins.code || '';
    const isCnamgs = insCode.startsWith('CNAMGS') || (prescription.insuranceKey && prescription.insuranceKey.startsWith('CNAMGS'));
    const isCnss = insCode === 'CNSS-ATMP' || insCode === 'CNSS' || prescription.insuranceKey === 'CNSS';
    const isPrivee = ins.group === 'privee' || ins.group === 'mutuelle';

    // Thème couleur selon l'assurance
    let bannerColor = '#0072ce'; // CNAMGS Bleu par défaut
    let bannerTitle = "CAISSE NATIONALE D'ASSURANCE MALADIE ET DE GARANTIE SOCIALE";
    let bannerSubtitle = "ORDONNANCE MÉDICALE OFFICIELLE CONVENTIONNÉE";
    let organLogo = "🏛️";

    if (insCode === 'CNAMGS-PVNR' || prescription.insuranceKey === 'CNAMGS_PVNR') {
      bannerColor = '#059669'; // Vert PVNR
      bannerSubtitle = "ORDONNANCE OFFICIELLE — GABONAIS ÉCONOMIQUEMENT FAIBLES (PVNR)";
      organLogo = "🤝";
    } else if (isCnss) {
      bannerColor = '#d97706'; // Ambre CNSS
      bannerTitle = "CAISSE NATIONALE DE SÉCURITÉ SOCIALE (CNSS)";
      bannerSubtitle = "ORDONNANCE MÉDICALE — RISQUES PROFESSIONNELS & ACCIDENTS DU TRAVAIL (AT/MP)";
      organLogo = "🛡️";
    } else if (isPrivee) {
      bannerColor = ins.color || '#7c3aed';
      bannerTitle = `${(ins.label || 'ASSURANCE PRIVÉE').toUpperCase()}`;
      bannerSubtitle = `ORDONNANCE MÉDICALE AVEC TIERS-PAYANT PHARMACEUTIQUE (${ins.shortLabel || 'TIERS-PAYANT'})`;
      organLogo = ins.logo || "🏢";
    } else if (insCode === 'NON_ASSURE' || prescription.insuranceKey === 'NONE') {
      bannerColor = '#334155';
      bannerTitle = (chu?.name || prescription.chuName || 'CENTRE HOSPITALIER UNIVERSITAIRE').toUpperCase();
      bannerSubtitle = "ORDONNANCE MÉDICALE HOSPITALIÈRE";
      organLogo = "🏥";
    }

    // Récupération sécurisée des allergies
    const rawAllergies = patient?.allergies || prescription.patientAllergies;
    const patientAllergies = (Array.isArray(rawAllergies) && rawAllergies.length > 0 && rawAllergies[0] !== 'Aucune connue')
      ? rawAllergies.join(', ')
      : (typeof rawAllergies === 'string' && rawAllergies !== 'Aucune connue' ? rawAllergies : null);

    const copayDisplay = ins.copay ? String(ins.copay).split(' ')[0] : '20%';

    return `
      <div class="ordonnance-document" style="font-family: Arial, -apple-system, sans-serif; color: #1e293b; line-height: 1.4; max-width: 780px; margin: 0 auto; background: #ffffff;">
        
        <!-- EN-TÊTE RÉPUBLIQUE GABONAISE & ASSURANCE -->
        <div style="border-bottom: 2.5px solid ${bannerColor}; padding-bottom: 12px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;">
            
            <!-- Ministère & Prescripteur -->
            <div style="text-align: left; font-size: 0.78rem; flex: 1;">
              <strong style="font-size: 0.85rem; color: #0a2540;">RÉPUBLIQUE GABONAISE</strong><br>
              <span style="color: #64748b; font-style: italic;">Union – Travail – Justice</span><br>
              <strong>MINISTÈRE DE LA SANTÉ</strong><br>
              <span style="color: ${bannerColor}; font-weight: 700;">${chu ? chu.name : prescription.chuName}</span><br>
              <span>Service : <strong>${prescription.service || 'Médecine Générale'}</strong></span>
            </div>

            <!-- Bannière Organisme d'Assurance -->
            <div style="text-align: center; flex: 1.5;">
              <div style="display: inline-flex; height: 8px; width: 60px; margin-bottom: 4px; border-radius: 2px; overflow: hidden; border: 1px solid #cbd5e1;">
                <div style="background: #009e49; flex: 1;"></div>
                <div style="background: #fcd116; flex: 1;"></div>
                <div style="background: #0072ce; flex: 1;"></div>
              </div>
              <div style="font-size: 0.95rem; font-weight: 800; color: ${bannerColor}; letter-spacing: 0.5px;">
                ${organLogo} ${bannerTitle}
              </div>
              <div style="font-size: 0.74rem; font-weight: 700; color: #475569; letter-spacing: 0.5px; margin-top: 2px;">
                ${bannerSubtitle}
              </div>
              <div style="font-size: 0.7rem; color: #64748b; margin-top: 2px;">
                Validité : <strong>3 mois</strong> sur l'ensemble du territoire national
              </div>
            </div>

            <!-- Réf & Horodatage -->
            <div style="text-align: right; font-size: 0.78rem; flex: 1;">
              <div style="background: #f8fafc; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; display: inline-block; text-align: right;">
                <span style="color: #64748b;">N° Ordonnance :</span><br>
                <strong style="color: ${bannerColor}; font-size: 0.95rem; font-family: monospace;">${prescription.id}</strong><br>
                <span style="color: #64748b;">Date :</span> <strong>${dateFormatted}</strong>
              </div>
            </div>

          </div>
        </div>

        <!-- BLOC IDENTITÉ PATIENT, NUMÉRO D'ASSURÉ & COUVERTURE -->
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; background: #f8fafc; margin-bottom: 14px; font-size: 0.82rem;">
          <div style="display: grid; grid-template-columns: 2fr 1.2fr; gap: 12px;">
            
            <div>
              <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 4px;">
                👤 Renseignements Patient / Bénéficiaire
              </div>
              <div style="line-height: 1.5;">
                <div><strong>Nom & Prénom :</strong> <span style="font-size: 0.95rem; font-weight: 700; color: #0f172a;">${patient ? patient.name : prescription.patientName}</span></div>
                <div>
                  <strong>Né(e) le :</strong> ${patient ? patient.birthdate : (prescription.patientBirth || 'N/C')} 
                  (${patient ? patient.gender : (prescription.patientGender || '')}) 
                  • <strong>Poids :</strong> ${prescription.patientWeight ? `${prescription.patientWeight} kg` : 'N/R'}
                </div>
                <div><strong>Identifiant INS-Gabon :</strong> <code>${patient ? patient.ins : prescription.patientIns}</code></div>
              </div>
            </div>

            <div style="border-left: 1px dashed #cbd5e1; padding-left: 12px; line-height: 1.5;">
              <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: ${bannerColor}; margin-bottom: 4px;">
                📋 Droits & Prise en Charge
              </div>
              <div><strong>Régime :</strong> ${ins.shortLabel || ins.label}</div>
              <div><strong>N° Immatriculation / Police :</strong> <code style="font-size: 0.85rem; font-weight: 700; color: #0f172a;">${patient ? patient.cnamgs : (prescription.patientCnamgs || prescription.patientInsuranceId || 'N/R')}</code></div>
              <div>
                <strong>Taux Prise en Charge :</strong> 
                <span class="badge ${ins.coverageRate === '100%' ? 'badge-green' : 'badge-blue'}" style="font-size: 0.78rem;">
                  ${ins.coverageRate || '80%'}
                </span>
                <span style="font-size: 0.72rem; color: #64748b;">(Ticket modérateur : ${copayDisplay})</span>
              </div>
              ${prescription.isAld ? `
                <div style="margin-top: 2px;">
                  <span class="badge badge-purple" style="font-size: 0.72rem;">★ Protocole ALD 100% Exonéré</span>
                </div>
              ` : ''}
            </div>

          </div>

          <!-- Alerte allergie sur l'ordonnance -->
          ${patientAllergies ? `
            <div style="margin-top: 8px; padding: 4px 8px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 4px; color: #9f1239; font-size: 0.75rem; display: flex; align-items: center; gap: 6px;">
              <span>⚠️</span>
              <strong>VIGILANCE MÉDICALE ALLERGIES :</strong> ${patientAllergies}
            </div>
          ` : ''}
        </div>

        <!-- CORPS DE L'ORDONNANCE : PRESCRIPTIONS MÉDICAMENTEUSES -->
        <div style="min-height: 280px; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff; margin-bottom: 14px;">
          <div style="font-size: 0.75rem; font-weight: 700; color: #0f172a; text-transform: uppercase; border-bottom: 1.5px solid #0284c7; padding-bottom: 4px; margin-bottom: 12px; display: flex; justify-content: space-between;">
            <span>Prescription Thérapeutique (DCI & Spécialités)</span>
            <span style="font-weight: 400; color: #64748b; font-size: 0.72rem;">Total : ${(prescription.medications || []).length} ligne(s)</span>
          </div>

          <div class="prescription-meds-list" style="display: flex; flex-direction: column; gap: 14px;">
            ${(prescription.medications || []).map((med, index) => `
              <div style="padding-bottom: 10px; border-bottom: 1px dotted #e2e8f0;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                  <div>
                    <strong style="font-size: 0.92rem; color: #0f172a;">${index + 1}. ${med.name}</strong>
                    ${med.dosage ? `<span style="font-size: 0.85rem; color: #334155; margin-left: 4px;">— ${med.dosage}</span>` : ''}
                    ${med.form ? `<span style="font-size: 0.78rem; color: #64748b; margin-left: 4px;">(${med.form})</span>` : ''}
                  </div>
                  <div style="text-align: right; font-size: 0.8rem; font-weight: 600; color: #0284c7;">
                    ${med.quantity ? `Qté : ${med.quantity}` : ''}
                    ${med.nonSubstituable ? `<span style="color: #b91c1c; font-size: 0.72rem; margin-left: 6px; border: 1px solid #fecaca; padding: 1px 4px; border-radius: 3px;">[Non Substituable]</span>` : ''}
                  </div>
                </div>

                <div style="font-size: 0.82rem; color: #1e293b; margin-top: 4px; padding-left: 14px; border-left: 2px solid ${bannerColor};">
                  👉 <strong>Posologie :</strong> ${med.posology || med.posologie || 'Selon avis médical'}
                  ${(med.duration || med.duree) ? `• <strong>Durée :</strong> ${med.duration || med.duree}` : ''}
                </div>

                ${med.instructions ? `
                  <div style="font-size: 0.76rem; color: #64748b; margin-top: 2px; padding-left: 14px; font-style: italic;">
                    ℹ️ ${med.instructions}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>

          ${(prescription.clinicalNotes || prescription.notes) ? `
            <div style="margin-top: 14px; padding: 8px 12px; background: #f8fafc; border-radius: 6px; font-size: 0.78rem; color: #475569;">
              <strong>Conseils & Précautions d'emploi :</strong> ${prescription.clinicalNotes || prescription.notes}
            </div>
          ` : ''}
        </div>

        <!-- ZONE DE SIGNATURE OFFICIELLE DU DOCTEUR & CADRE OFFICINE PHARMACEUTIQUE -->
        <div style="display: grid; grid-template-columns: 140px 1.5fr 1.5fr; gap: 12px; margin-bottom: 12px; align-items: stretch;">
          
          <!-- QR Code Authentification -->
          <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; text-align: center; background: #ffffff; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <div id="qrcode-ordonnance" style="width: 100px; height: 100px; background: #f8fafc; display: flex; align-items: center; justify-content: center;"></div>
            <div style="font-size: 0.65rem; color: #64748b; margin-top: 4px;">
              Scan Sécurisé Officine<br>
              <code>${prescription.id}</code>
            </div>
          </div>

          <!-- Cadre Signature et Cachet Médical du Docteur -->
          <div style="border: 1.5px solid #0284c7; border-radius: 8px; padding: 10px 12px; background: #f0f9ff; display: flex; flex-direction: column; justify-content: space-between; min-height: 140px;">
            <div>
              <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: #0369a1; border-bottom: 1px solid #bae6fd; padding-bottom: 3px; margin-bottom: 4px;">
                👨‍⚕️ Médecin Prescripteur
              </div>
              <div style="font-size: 0.8rem; line-height: 1.35;">
                <strong style="color: #0f172a;">${prescription.doctor || prescription.doctorName || 'Dr. Praticien Hospitalier'}</strong><br>
                <span style="font-size: 0.74rem; color: #475569;">${chu ? (chu.shortName || chu.name) : (prescription.chuName || 'CHU')} — ${prescription.service || 'Service Clinique'}</span><br>
                <span style="font-size: 0.7rem; color: #64748b;">N° Ordre ONMG : <strong>${prescription.onmg || prescription.doctorOnmg || 'ONMG-2024-B14'}</strong></span>
              </div>
            </div>

            <!-- Emplacement officiel pour la signature manuscrite -->
            <div style="border-top: 1px dashed #0284c7; padding-top: 4px; text-align: center; margin-top: 10px;">
              <div style="font-size: 0.7rem; color: #0284c7; font-weight: 700;">
                Cachet Humide & Signature Manuscrite du Docteur :
              </div>
              <div style="height: 45px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-style: italic; font-size: 0.75rem;">
                (Apposer griffe et signature ici)
              </div>
            </div>
          </div>

          <!-- Cadre Réservé à l'Officine Pharmaceutique -->
          <div style="border: 1.5px solid #10b981; border-radius: 8px; padding: 10px 12px; background: #ecfdf5; display: flex; flex-direction: column; justify-content: space-between; min-height: 140px;">
            <div>
              <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: #047857; border-bottom: 1px solid #a7f3d0; padding-bottom: 3px; margin-bottom: 4px;">
                💊 Cadre Réservé à l'Officine Pharmaceutique
              </div>
              <div style="font-size: 0.72rem; color: #374151; line-height: 1.35;">
                Date délivrance : ____ / ____ / 2026<br>
                Part Assurance (${ins.coverageRate}) : ____________ FCFA<br>
                Ticket modérateur payé : ____________ FCFA
              </div>
            </div>

            <div style="border-top: 1px dashed #10b981; padding-top: 4px; text-align: center; margin-top: 10px;">
              <div style="font-size: 0.7rem; color: #047857; font-weight: 700;">
                Cachet de la Pharmacie Conventionnée :
              </div>
              <div style="height: 45px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-style: italic; font-size: 0.75rem;">
                (Tampon de dispensation)
              </div>
            </div>
          </div>

        </div>

        <!-- MENTIONS LÉGALES PIED DE PAGE -->
        <div style="border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 0.68rem; color: #64748b; text-align: center; line-height: 1.3;">
          Document médico-légal officiel conforme au Code de la Santé Publique et aux conventions régissant les régimes d'assurance maladie du Gabon (CNAMGS / CNSS).<br>
          Ordonnance délivrée par le Système National d'Interconnexion Hospitalière GAB-SANTE • Toute falsification est punie par la loi.
        </div>

      </div>
    `;
  },

  /**
   * Rendu du QR Code officiel de l'ordonnance
   */
  renderQrCode(prescription, patient, chu, insurance) {
    const container = document.getElementById('qrcode-ordonnance');
    if (!container) return;
    container.innerHTML = '';

    const payload = JSON.stringify({
      app: 'GAB-SANTE-ORDONNANCE',
      id: prescription.id,
      patient: patient?.name || prescription.patientName,
      ins: patient?.ins || prescription.patientIns,
      assurance: insurance?.code || prescription.insuranceKey || prescription.insuranceCode,
      medsCount: (prescription.medications || []).length,
      doctor: prescription.doctor || prescription.doctorName,
      chu: chu?.shortName || chu?.name || prescription.chuName,
      date: prescription.dateText || prescription.date,
      signatureRequired: true
    });

    if (window.QRCode) {
      new QRCode(container, {
        text: payload,
        width: 95,
        height: 95,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    } else {
      container.innerHTML = `<div style="font-size: 0.65rem; color: #64748b; padding: 10px;">ORDO-CERT<br><strong>${prescription.id}</strong></div>`;
    }
  },

  /**
   * Ouvre la modale de visualisation et d'impression de l'ordonnance
   */
  openViewer(prescription, patient, chu, insurance) {
    const modal = document.getElementById('modal-ordonnance-view');
    const container = document.getElementById('ordonnance-view-content');
    if (!modal || !container) return;

    container.innerHTML = this.generateHtml(prescription, patient, chu, insurance);
    modal.classList.remove('hidden');

    setTimeout(() => {
      this.renderQrCode(prescription, patient, chu, insurance);
    }, 150);
  },

  closeViewer() {
    document.getElementById('modal-ordonnance-view')?.classList.add('hidden');
  },

  /**
   * Impression de l'ordonnance
   */
  printPrescription() {
    window.print();
  },

  /**
   * Exportation HTML autonome
   */
  exportHtml() {
    if (!this.currentPrescription) return;
    const p = this.currentPrescription;
    const content = document.getElementById('ordonnance-view-content')?.innerHTML;
    if (!content) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Ordonnance Médicale - ${p.id} - ${p.patientName}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 1.5rem; background: #f8fafc; color: #1e293b; }
    .page { max-width: 800px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    @media print {
      body { margin: 0; background: white; }
      .page { box-shadow: none; padding: 0.5rem; }
    }
  </style>
</head>
<body>
  <div class="page">${content}</div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const patientSlug = (p.patientName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `Ordonnance-${p.id || 'Nouveau'}-${patientSlug}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

// Exposition globale
if (typeof window !== 'undefined') {
  window.OrdonnanceService = OrdonnanceService;
}
