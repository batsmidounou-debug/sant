/**
 * GAB-SANTE - Moteur d'Interopérabilité HL7 / FHIR R4 (Fast Healthcare Interoperability Resources)
 * Génération conforme de Bundle FHIR, Patient, Coverage, Observation et Encounter.
 * Compatible avec DHIS2, OpenEMR et les Systèmes d'Information Hospitaliers (SIH).
 */

const FhirService = {
  /**
   * Génère un Bundle FHIR R4 complet pour un patient donné
   * @param {Object} patient - Dossier patient DMP
   * @param {Object} chuStatus - Répertoire des établissements
   * @param {Function} getInsuranceFn - Fonction de résolution de l'assurance
   * @returns {Object} Bundle FHIR R4 valide au format JSON
   */
  generateBundle(patient, chuStatus = {}, getInsuranceFn = null) {
    if (!patient) return {};

    const resolveInsurance = getInsuranceFn || (k => (window.INSURANCE_LIST && window.INSURANCE_LIST[k]) || { label: 'Assurance', code: 'STD', coverageRate: '80%', copay: '20%' });
    const ins = resolveInsurance(patient.insurance);
    const orgName = chuStatus[patient.currentLocation]?.name || patient.currentLocation;

    return {
      resourceType: 'Bundle',
      id: `bundle-gabon-${patient.id.toLowerCase()}`,
      meta: {
        lastUpdated: new Date().toISOString(),
        profile: ['http://hl7.org/fhir/StructureDefinition/document']
      },
      type: 'document',
      timestamp: new Date().toISOString(),
      network: 'GAB-SANTE',
      country: 'GA',
      entry: [
        // 1. Ressource Patient
        {
          fullUrl: `urn:uuid:patient-${patient.id.toLowerCase()}`,
          resource: {
            resourceType: 'Patient',
            id: patient.id,
            identifier: [
              {
                use: 'official',
                system: 'urn:oid:gabon:sani:ins',
                value: patient.ins,
                assigner: { display: 'Ministère de la Santé du Gabon (INS-Gabon)' }
              },
              {
                use: 'secondary',
                system: 'urn:oid:gabon:cnamgs:id',
                value: patient.cnamgs,
                assigner: { display: 'CNAMGS - Caisse Nationale d\'Assurance Maladie' }
              }
            ],
            active: true,
            name: [{ use: 'official', text: patient.name }],
            telecom: [{ system: 'phone', value: patient.contacts || '+241' }],
            gender: patient.gender === 'M' ? 'male' : 'female',
            birthDate: patient.birthdate,
            managingOrganization: {
              reference: `Organization/${patient.currentLocation}`,
              display: orgName
            }
          }
        },

        // 2. Ressource Coverage (Couverture Maladie & Tiers-Payant)
        {
          fullUrl: `urn:uuid:cov-${patient.id.toLowerCase()}`,
          resource: {
            resourceType: 'Coverage',
            id: `cov-${patient.id.toLowerCase()}`,
            status: 'active',
            type: {
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                code: ins.group === 'public' ? 'PUBLICPOL' : 'HIP',
                display: ins.label
              }]
            },
            subscriber: { reference: `Patient/${patient.id}` },
            subscriberId: patient.cnamgs,
            beneficiary: { reference: `Patient/${patient.id}` },
            relationship: {
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/subscriber-relationship',
                code: 'self',
                display: 'Titulaire / Assuré principal'
              }]
            },
            period: { end: '2026-12-31' },
            payor: [{ display: ins.label }],
            class: [
              {
                type: { coding: [{ code: 'plan' }] },
                value: ins.code,
                name: `${ins.label} (${ins.coverageRate})`
              }
            ],
            costToBeneficiary: [
              {
                type: { text: 'Ticket Modérateur Patient' },
                valueMoney: {
                  value: parseInt(ins.copay, 10) || 20,
                  currency: 'XAF'
                }
              }
            ]
          }
        },

        // 3. Ressource Observation (Groupe Sanguin & Rhésus)
        {
          fullUrl: `urn:uuid:blood-type-${patient.id.toLowerCase()}`,
          resource: {
            resourceType: 'Observation',
            id: `blood-type-${patient.id.toLowerCase()}`,
            status: 'final',
            category: [{
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'laboratory',
                display: 'Laboratory'
              }]
            }],
            code: {
              coding: [{
                system: 'http://loinc.org',
                code: '883-9',
                display: 'ABO and Rh group [Type] in Blood'
              }]
            },
            subject: { reference: `Patient/${patient.id}` },
            valueString: patient.bloodType
          }
        },

        // 4. Ressources Encounter (Parcours clinique inter-CHU)
        ...(patient.history || []).map((h, idx) => ({
          fullUrl: `urn:uuid:enc-${patient.id.toLowerCase()}-${idx}`,
          resource: {
            resourceType: 'Encounter',
            id: `enc-${patient.id.toLowerCase()}-${idx}`,
            status: 'finished',
            class: {
              system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
              code: 'IMP',
              display: 'inpatient encounter'
            },
            serviceProvider: {
              reference: `Organization/${h.chu}`,
              display: chuStatus[h.chu]?.name || h.chu
            },
            participant: [{
              individual: { display: h.doctor }
            }],
            period: { start: h.date },
            reasonCode: [{ text: h.summary }]
          }
        }))
      ]
    };
  }
};

// Exposition globale
if (typeof window !== 'undefined') {
  window.FhirService = FhirService;
}
