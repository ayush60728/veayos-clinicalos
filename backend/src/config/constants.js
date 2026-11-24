/**
 * Constants & Configuration for VEAYOS Homoeopathy ClinicalOS Backend
 */

export const AUTHORIZED_USERS = [
  {
    email: 'vpdixit75@gmail.com',
    name: 'Dr. V. P. Dixit',
    title: 'Senior Homoeopath & Medical Director',
    defaultRole: 'doctor',
    allowedRoles: ['doctor', 'admin', 'staff'],
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    clinic: 'VEAYOS Homoeopathic Clinic & Research Centre',
    regNo: 'BHMS-REG-84729'
  },
  {
    email: 'ved@veayos.com',
    name: 'Dr. Ved Prakash',
    title: 'Consultant Homoeopath & Operations Lead',
    defaultRole: 'doctor',
    allowedRoles: ['doctor', 'staff', 'admin'],
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80',
    clinic: 'VEAYOS Homoeopathic Clinic & Research Centre',
    regNo: 'MD-HOM-55102'
  }
];

export const WHITELIST_EMAILS = AUTHORIZED_USERS.map(u => u.email.toLowerCase());

export const DEFAULT_CLINIC_SETTINGS = {
  clinicName: 'VEAYOS Homoeopathic Clinic & Research Centre',
  doctorName: 'Dr. V. P. Dixit',
  qualifications: 'B.H.M.S., M.D. (Hom.), Senior Homoeopathic Consultant',
  regNo: 'BHMS-REG-84729 / CCH Delhi',
  phone: '+91 98112 34567 / 011-26895431',
  email: 'consult@veayosclinic.com',
  address: 'Suite 204, Clinical Excellence Block, Metro Pillar 42, South Ext II, New Delhi 110049',
  logoUrl: '/logo.png',
  letterpadHeaderImage: null,
  signatureStampImage: null,
  disclaimer: 'Homoeopathic medicine is customised to your individual totality. Keep medicines away from strong scents, camphor, and sunlight. Dissolve globules in a clean dry mouth.'
};

export const DEFAULT_AISENSY_SETTINGS = {
  apiKey: process.env.AISENSY_API_KEY || '',
  senderNumber: '+91 98112 34567',
  campaignName: 'prescription_share_v1',
  reminderCampaign: 'followup_reminder_v1',
  reminderDaysBefore: 1,
  isConnected: false
};

export const JWT_SECRET = process.env.JWT_SECRET || 'veayos-super-secure-clinicalos-jwt-secret-key-2025';
export const JWT_EXPIRES_IN = '7d';
