const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  // 1. Advocate User
  const advocatePassword = await bcrypt.hash('Advocate@123', 12);
  const advocateUser = await prisma.user.upsert({
    where: { email: 'advocate@lexdesk.law' },
    update: { password_hash: advocatePassword },
    create: {
      email: 'advocate@lexdesk.law',
      password_hash: advocatePassword,
      role: 'ADVOCATE',
      is_active: true,
      is_verified: true,
      two_fa_enabled: false, // Turn off for demo ease
      advocate_profile: {
        create: {
          full_name: 'Adv. Rajan Sharma',
          bar_registration_number: 'MAH/5521/1998',
          enrollment_date: new Date('1998-05-15'),
          high_court: 'Bombay High Court',
          practice_areas: ['Corporate Law', 'Property Disputes', 'Civil Litigation'],
          consultation_fee_inr: 2500,
        }
      }
    }
  });

  // 2. Client User
  const clientPassword = await bcrypt.hash('Client@123', 12);
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@lexdesk.law' },
    update: { password_hash: clientPassword },
    create: {
      email: 'client@lexdesk.law',
      password_hash: clientPassword,
      role: 'CLIENT',
      is_active: true,
      is_verified: true,
      client_profile: {
        create: {
          full_name: 'Anjali Mehta',
          id_type: 'PAN',
          preferred_language: 'en',
        }
      }
    }
  });

  console.log('Upserted Advocate:', advocateUser.id);
  console.log('Upserted Client:', clientUser.id);

  // 3. Demo Cases linked to real users
  const demoCases = [
    {
      case_number: 'LEX-2026-00101',
      client_id: clientUser.id,
      advocate_id: advocateUser.id,
      matter_type: 'CIVIL',
      title: 'Property Dispute — Pune District Court',
      description: 'Dispute over property ownership relating to Survey No. 412/B, Pune.',
      status: 'ACTIVE',
      urgency: 'HIGH',
      court_name: 'Pune District Court',
    },
    {
      case_number: 'LEX-2026-00102',
      client_id: clientUser.id,
      advocate_id: advocateUser.id,
      matter_type: 'CONSUMER',
      title: 'Consumer Complaint — NCDRC',
      description: 'Complaint against builder for delayed possession and deficiency of service.',
      status: 'UNDER_REVIEW',
      urgency: 'MEDIUM',
      court_name: 'NCDRC, New Delhi',
    },
    {
      case_number: 'LEX-2026-00103',
      client_id: clientUser.id,
      advocate_id: advocateUser.id,
      matter_type: 'LABOUR',
      title: 'Employment Dispute — Labour Court',
      description: 'Wrongful termination claim against former employer.',
      status: 'ACCEPTED',
      urgency: 'LOW',
      court_name: 'Labour Court, Pune',
    },
  ];

  for (const c of demoCases) {
    await prisma.case.upsert({
      where: { case_number: c.case_number },
      update: {},
      create: c,
    });
  }

  console.log('Upserted 3 demo cases.');
  console.log('Seeding complete.');

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
