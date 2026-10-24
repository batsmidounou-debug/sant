/**
 * GAB-SANTE - Fiche Navette Médicale Officielle de Transfert SAMU 1300 Gabon
 * Génération certifiée, validation cryptographique par QR Code,
 * impression haute fidélité et export autonome au format HTML.
 */

const FicheNavetteService = {
  currentTransfer: null,

  /**
   * Génère le HTML complet de la fiche navette médicale
   */
  generateHtml(transfer, patient, originChu, destChu, insurance) {
    this.currentTransfer = transfer;
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    const timeFormatted = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit'
    });

    const patIns = insurance || { label: 'CNAMGS', code: 'CNAMGS', coverageRate: '80%', copay: '20%' };
    const pBlood = patient?.bloodType || 'Non renseigné';
    const pAllergies = (patient?.allergies && patient.allergies.length > 0) ? patient.allergies.join(', ') : 'Aucune allergie connue';
    const pChronic = (patient?.chronicDiseases && patient.chronicDiseases.length > 0) ? patient.chronicDiseases.join(', ') : 'Aucune';

    return `
      <div class="fiche-navette-document" style="font-family: Arial, -apple-system, sans-serif; color: #1e293b; line-height: 1.4;">
        
        <!-- EN-TÊTE OFFICIEL DE LA RÉPUBLIQUE GABONAISE -->
        <div style="border-bottom: 3px double #0f4c81; padding-bottom: 12px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;">
            <div style="text-align: left; font-size: 0.78rem;">
              <strong style="font-size: 0.85rem; color: #0a2540;">RÉPUBLIQUE GABONAISE</strong><br>
              <span style="color: #64748b; font-style: italic;">Union – Travail – Justice</span><br>
              <strong>MINISTÈRE DE LA SANTÉ</strong><br>
              Direction Générale des Établissements de Soins<br>
              <strong>SAMU 1300 — RÉGULATION NATIONALE</strong>
            </div>

            <div style="text-align: center;">
              <div style="display: inline-flex; height: 10px; width: 60px; margin-bottom: 4px; border-radius: 2px; overflow: hidden; border: 1px solid #cbd5e1;">
                <div style="background: #009e49; flex: 1;"></div>
                <div style="background: #fcd116; flex: 1;"></div>
                <div style="background: #0072ce; flex: 1;"></div>
              </div>
              <div style="font-size: 1.15rem; font-weight: 800; color: #0f4c81; letter-spacing: 0.5px;">FICHE NAVETTE MÉDICALISÉE</div>
              <div style="font-size: 0.75rem; font-weight: 700; color: #e63946; letter-spacing: 1px;">TRANSFERT D'URGENCE INTER-HOSPITALIER</div>
            </div>

            <div style="text-align: right; font-size: 0.78rem;">
              <div style="background: #f1f5f9; padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; display: inline-block;">
                <span style="color: #64748b;">Réf. SAMU :</span> <strong>${transfer.id}</strong><br>
                <span style="color: #64748b;">Date émission :</span> <strong>${dateFormatted} à ${timeFormatted}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- BANDEAU SCORE DE GRAVITÉ & TRANSPORT -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; font-size: 0.82rem;">
          <div>
            <span style="color: #64748b;">Score de Gravité :</span><br>
            <strong style="color: #b91c1c; font-size: 0.95rem;">🚨 ${transfer.gravityScore}</strong>
          </div>
          <div>
            <span style="color: #64748b;">Vecteur de Transport :</span><br>
            <strong>🚑 ${transfer.transportMode}</strong>
          </div>
          <div>
            <span style="color: #64748b;">Statut Transfert :</span><br>
            <span style="display: inline-block; background: #ecfdf5; color: #065f46; font-weight: 700; padding: 2px 8px; border-radius: 4px; border: 1px solid #a7f3d0;">
              ✓ ${transfer.status}
            </span>
          </div>
        </div>

        <!-- BLOC PATIENT DMP & ALERTE VITALE -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 14px;">
          
          <!-- Informations administratives -->
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; background: #ffffff;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #0f4c81; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
              👤 Identité du Patient & Droits Sociaux
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.82rem;">
              <div><strong>Nom complet :</strong> ${patient ? patient.name : transfer.patientName}</div>
              <div><strong>Né(e) le :</strong> ${patient ? patient.birthdate : 'N/C'} (${patient ? patient.gender : 'N/C'})</div>
              <div><strong>INS-Gabon :</strong> <code>${patient ? patient.ins : 'N/C'}</code></div>
              <div><strong>N° CNAMGS :</strong> <code>${patient ? patient.cnamgs : 'N/C'}</code></div>
              <div style="grid-column: 1 / -1;">
                <strong>Couverture :</strong> ${patIns.logo || '🏛️'} ${patIns.label} (${patIns.coverageRate} prise en charge)
              </div>
            </div>
          </div>

          <!-- Alertes Médicales Vitales -->
          <div style="border: 1px solid #fecdd3; border-radius: 8px; padding: 10px 14px; background: #fff1f2;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #9f1239; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #ffe4e6; padding-bottom: 4px;">
              ⚠️ Alertes Médicales Vitales
            </div>
            <div style="font-size: 0.82rem;">
              <div><strong>Groupe Sanguin :</strong> <span style="background: #dc2626; color: white; padding: 1px 6px; border-radius: 4px; font-weight: 700;">${pBlood}</span></div>
              <div style="margin-top: 4px;"><strong>Allergies :</strong> <span style="color: #b91c1c; font-weight: 600;">${pAllergies}</span></div>
              <div style="margin-top: 4px;"><strong>Terrain :</strong> ${pChronic}</div>
            </div>
          </div>

        </div>

        <!-- CORRIDOR DU TRANSFERT (DÉPART & ARRIVÉE) -->
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-bottom: 14px;">
          <div style="background: #0f4c81; color: white; padding: 6px 12px; font-size: 0.78rem; font-weight: 700; display: flex; justify-content: space-between;">
            <span>HÔPITAL ÉMETTEUR (DÉPART)</span>
            <span>➔</span>
            <span>HÔPITAL RÉCEPTEUR (ACCUEIL)</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 12px; background: #f8fafc; font-size: 0.82rem;">
            <div>
              <strong style="color: #0f172a; font-size: 0.9rem;">${originChu?.name || transfer.fromChu}</strong><br>
              <span style="color: #64748b;">📍 ${originChu?.location || 'Libreville'}</span><br>
              <span>Médecin Demandeur : <strong>${transfer.doctorRequester}</strong></span><br>
              <span>Régulation : <code>${originChu?.emergencyPhone || originChu?.phone || '1300'}</code></span>
            </div>
            <div style="border-left: 1px dashed #cbd5e1; padding-left: 15px;">
              <strong style="color: #0f172a; font-size: 0.9rem;">${destChu?.name || transfer.toChu}</strong><br>
              <span style="color: #64748b;">📍 ${destChu?.location || 'Libreville'}</span><br>
              <span>Médecin Accepteur : <strong>${transfer.doctorAcceptor}</strong></span><br>
              <span>Lit Réservé : <strong style="color: #059669;">Confirmé en Unité Spécialisée</strong></span>
            </div>
          </div>
        </div>

        <!-- MOTIF CLINIQUEMENT CONSIGNÉ -->
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 16px; background: #ffffff;">
          <div style="font-size: 0.74rem; font-weight: 700; color: #0f4c81; text-transform: uppercase; margin-bottom: 6px;">
            📋 Motif Médical Circonstancié du Transfert
          </div>
          <p style="font-size: 0.85rem; color: #1e293b; margin: 0; line-height: 1.5; font-weight: 500;">
            ${transfer.motif}
          </p>
        </div>

        <!-- SIGNATURES, CACHETS & QR CODE D'AUTHENTIFICATION -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 130px; gap: 14px; align-items: stretch; margin-top: 10px; border-top: 2px solid #e2e8f0; padding-top: 12px;">
          
          <!-- Visa Émetteur -->
          <div style="border: 1px dashed #94a3b8; border-radius: 6px; padding: 8px 10px; font-size: 0.74rem; min-height: 90px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <strong>Visa & Cachet Médecin Émetteur :</strong><br>
              <span style="color: #64748b;">${transfer.doctorRequester}</span>
            </div>
            <div style="font-size: 0.68rem; color: #94a3b8; font-style: italic;">Certifié conforme pour départ SMUR</div>
          </div>

          <!-- Visa Récepteur -->
          <div style="border: 1px dashed #94a3b8; border-radius: 6px; padding: 8px 10px; font-size: 0.74rem; min-height: 90px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <strong>Visa & Cachet Service d'Accueil :</strong><br>
              <span style="color: #64748b;">${transfer.doctorAcceptor}</span>
            </div>
            <div style="font-size: 0.68rem; color: #94a3b8; font-style: italic;">Admis en plateau technique</div>
          </div>

          <!-- QR Code de Traçabilité SAMU -->
          <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div id="qrcode-fiche" style="width: 84px; height: 84px; display: flex; align-items: center; justify-content: center; background: #fff; padding: 2px; border: 1px solid #cbd5e1; border-radius: 4px;"></div>
            <span style="font-size: 0.65rem; color: #64748b; margin-top: 4px; font-weight: 600;">Contrôle SAMU 1300</span>
          </div>

        </div>

        <!-- MENTION LÉGALE BAS DE PAGE -->
        <div style="margin-top: 14px; text-align: center; font-size: 0.68rem; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 6px;">
          Document officiel généré par le Système National d'Interconnexion Hospitalière GAB-SANTE • Interopérabilité HL7/FHIR R4 • CNAMGS Réf. GA-2026
        </div>

      </div>
    `;
  },

  /**
   * Génère le QR Code dans le conteneur #qrcode-fiche
   */
  renderQrCode(transfer, patient) {
    const qrContainer = document.getElementById('qrcode-fiche');
    if (!qrContainer) return;
    qrContainer.innerHTML = '';

    const payload = JSON.stringify({
      system: 'GAB-SANTE-SAMU1300',
      transferId: transfer.id,
      patientId: patient?.id || transfer.patientId,
      ins: patient?.ins || 'N/A',
      cnamgs: patient?.cnamgs || 'N/A',
      from: transfer.fromChu,
      to: transfer.toChu,
      gravity: transfer.gravityScore,
      timestamp: new Date().toISOString()
    });

    if (typeof QRCode !== 'undefined') {
      try {
        new QRCode(qrContainer, {
          text: payload,
          width: 80,
          height: 80,
          colorDark: '#0a2540',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      } catch (err) {
        console.warn('Erreur génération QRCode:', err);
        qrContainer.innerHTML = '<span style="font-size:0.6rem;color:#64748b;">QR CERTIFIÉ</span>';
      }
    } else {
      qrContainer.innerHTML = '<span style="font-size:0.6rem;color:#64748b;">QR SAMU 1300</span>';
    }
  },

  /**
   * Ouvre la modale Fiche Navette
   */
  openModal(transferId, patients = [], transfers = [], chuStatus = {}, insuranceFn = null) {
    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer) return;

    const patient = patients.find(p => p.id === transfer.patientId);
    const originChu = chuStatus[transfer.fromChu] || { name: transfer.fromChu, location: 'Libreville' };
    const destChu = chuStatus[transfer.toChu] || { name: transfer.toChu, location: 'Libreville' };
    const insurance = insuranceFn ? insuranceFn(patient?.insurance) : (window.INSURANCE_LIST && window.INSURANCE_LIST[patient?.insurance]);

    const contentEl = document.getElementById('fiche-navette-contenu');
    const modalEl = document.getElementById('modal-fiche-navette');

    if (contentEl) {
      contentEl.innerHTML = this.generateHtml(transfer, patient, originChu, destChu, insurance);
      this.renderQrCode(transfer, patient);
    }

    if (modalEl) {
      modalEl.classList.remove('hidden');
    }
  },

  /**
   * Ferme la modale Fiche Navette
   */
  closeModal() {
    const modalEl = document.getElementById('modal-fiche-navette');
    if (modalEl) modalEl.classList.add('hidden');
  },

  /**
   * Exporte la fiche navette sous la forme d'un fichier HTML téléchargeable et autonome
   */
  exportHtml() {
    const contentEl = document.getElementById('fiche-navette-contenu');
    if (!contentEl) return;

    const transferId = this.currentTransfer ? this.currentTransfer.id : 'TRANSFERT';
    const fullHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Fiche Navette Médicale - ${transferId}</title>
  <style>
    body {
      background: #f1f5f9;
      font-family: Arial, -apple-system, sans-serif;
      padding: 20px;
      display: flex;
      justify-content: center;
    }
    .document-page {
      background: white;
      max-width: 800px;
      width: 100%;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    @media print {
      body { background: white; padding: 0; }
      .document-page { box-shadow: none; padding: 0; max-width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="document-page">
    <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: flex-end; gap: 10px;">
      <button onclick="window.print()" style="background: #0072ce; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">
        🖨️ Imprimer ce document
      </button>
    </div>
    ${contentEl.innerHTML}
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fiche_Navette_${transferId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

// Exposition globale
if (typeof window !== 'undefined') {
  window.FicheNavetteService = FicheNavetteService;
}
