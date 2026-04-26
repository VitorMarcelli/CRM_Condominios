import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create Super Admin
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123456';
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@crmcondominios.com';
  const adminName = process.env.SEED_ADMIN_NAME || 'Administrador Master';

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const superAdmin = await prisma.internalUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      fullName: adminName,
      email: adminEmail,
      phone: '21999999999',
      role: 'SUPER_ADMIN',
      passwordHash,
      status: 'active',
    },
  });
  console.log(`✅ Super Admin: ${superAdmin.email}`);

  // 2. Create sample condominium
  const condominium = await prisma.condominium.create({
    data: {
      name: 'Residencial Bela Vista',
      document: '12.345.678/0001-90',
      address: 'Rua das Flores, 123 - Centro',
      phone: '(21) 3333-4444',
      email: 'contato@belavista.com',
      status: 'active',
    },
  });
  console.log(`✅ Condominium: ${condominium.name}`);

  // 3. Create internal users for the condominium
  const sindicoHash = await bcrypt.hash('Sindico@123', 12);
  const sindico = await prisma.internalUser.create({
    data: {
      condominiumId: condominium.id,
      fullName: 'Carlos Silva',
      email: 'sindico@belavista.com',
      phone: '21988887777',
      role: 'SINDICO',
      passwordHash: sindicoHash,
      status: 'active',
    },
  });

  const zeladorHash = await bcrypt.hash('Zelador@123', 12);
  const zelador = await prisma.internalUser.create({
    data: {
      condominiumId: condominium.id,
      fullName: 'José Santos',
      email: 'zelador@belavista.com',
      phone: '21977776666',
      role: 'ZELADOR',
      passwordHash: zeladorHash,
      status: 'active',
    },
  });

  const atendenteHash = await bcrypt.hash('Atendente@123', 12);
  const atendente = await prisma.internalUser.create({
    data: {
      condominiumId: condominium.id,
      fullName: 'Ana Oliveira',
      email: 'portaria@belavista.com',
      phone: '21966665555',
      role: 'ATENDENTE',
      passwordHash: atendenteHash,
      status: 'active',
    },
  });

  console.log(`✅ Users: Síndico, Zelador, Atendente`);

  // 4. Create blocks
  const blocoA = await prisma.block.create({
    data: { condominiumId: condominium.id, name: 'Bloco A', code: 'A' },
  });
  const blocoB = await prisma.block.create({
    data: { condominiumId: condominium.id, name: 'Bloco B', code: 'B' },
  });
  console.log(`✅ Blocks: ${blocoA.name}, ${blocoB.name}`);

  // 5. Create units
  const units: Prisma.UnitGetPayload<{}>[] = [];
  for (const block of [blocoA, blocoB]) {
    for (let floor = 1; floor <= 3; floor++) {
      for (let unit = 1; unit <= 4; unit++) {
        const unitNumber = `${floor}0${unit}`;
        const created = await prisma.unit.create({
          data: {
            condominiumId: condominium.id,
            blockId: block.id,
            number: unitNumber,
            floor: String(floor),
            status: 'active',
          },
        });
        units.push(created);
      }
    }
  }
  console.log(`✅ Units: ${units.length} created`);

  // 6. Create residents
  const residentData = [
    { fullName: 'João Silva', phone: '21999001001', email: 'joao@email.com' },
    { fullName: 'Maria Santos', phone: '21999002002', email: 'maria@email.com' },
    { fullName: 'Pedro Oliveira', phone: '21999003003', email: 'pedro@email.com' },
    { fullName: 'Ana Costa', phone: '21999004004', email: 'ana@email.com' },
    { fullName: 'Lucas Souza', phone: '21999005005', email: 'lucas@email.com' },
  ];

  const residents: Prisma.ResidentGetPayload<{}>[] = [];
  for (let i = 0; i < residentData.length; i++) {
    const resident = await prisma.resident.create({
      data: {
        condominiumId: condominium.id,
        unitId: units[i]?.id,
        ...residentData[i],
        status: 'active',
      },
    });
    residents.push(resident);
  }
  console.log(`✅ Residents: ${residents.length} created`);

  // 7. Create occurrence categories
  const categories = [
    { name: 'Problema no portão', severityDefault: 'critical', isEmergency: true },
    { name: 'Incidente de segurança', severityDefault: 'critical', isEmergency: true },
    { name: 'Falha estrutural', severityDefault: 'high', isEmergency: true },
    { name: 'Barulho', severityDefault: 'low', isEmergency: false },
    { name: 'Vazamento', severityDefault: 'high', isEmergency: false },
    { name: 'Elevador', severityDefault: 'high', isEmergency: false },
    { name: 'Limpeza', severityDefault: 'low', isEmergency: false },
    { name: 'Manutenção geral', severityDefault: 'medium', isEmergency: false },
    { name: 'Risco operacional', severityDefault: 'critical', isEmergency: true },
    { name: 'Emergência relatada por morador', severityDefault: 'critical', isEmergency: true },
    { name: 'Outros', severityDefault: 'low', isEmergency: false },
  ];

  for (const cat of categories) {
    await prisma.occurrenceCategory.create({
      data: { condominiumId: condominium.id, ...cat },
    });
  }
  console.log(`✅ Categories: ${categories.length} created`);

  // 8. Create business hours (Mon-Fri 08:00-18:00)
  const weekdays = [
    { weekday: 0, startTime: '00:00', endTime: '00:00', isActive: false }, // Sunday
    { weekday: 1, startTime: '08:00', endTime: '18:00', isActive: true },  // Monday
    { weekday: 2, startTime: '08:00', endTime: '18:00', isActive: true },  // Tuesday
    { weekday: 3, startTime: '08:00', endTime: '18:00', isActive: true },  // Wednesday
    { weekday: 4, startTime: '08:00', endTime: '18:00', isActive: true },  // Thursday
    { weekday: 5, startTime: '08:00', endTime: '18:00', isActive: true },  // Friday
    { weekday: 6, startTime: '08:00', endTime: '12:00', isActive: true },  // Saturday
  ];

  for (const bh of weekdays) {
    await prisma.businessHour.create({
      data: { condominiumId: condominium.id, ...bh },
    });
  }
  console.log(`✅ Business Hours: 7 days configured`);

  // 9. Create dispatch group
  const dispatchGroup = await prisma.dispatchGroup.create({
    data: {
      condominiumId: condominium.id,
      name: 'Emergências Operacionais',
      description: 'Grupo de acionamento para emergências e problemas operacionais críticos',
    },
  });

  await prisma.dispatchGroupMember.create({
    data: { dispatchGroupId: dispatchGroup.id, userId: sindico.id, priority: 1 },
  });
  await prisma.dispatchGroupMember.create({
    data: { dispatchGroupId: dispatchGroup.id, userId: zelador.id, priority: 2 },
  });
  console.log(`✅ Dispatch Group: ${dispatchGroup.name}`);

  // 10. Create escalation rules
  const rules = [
    {
      name: 'Problema no Portão',
      triggerKeywords: ['portão travado', 'portão quebrado', 'portao travado', 'portao quebrado'],
      urgencyLevel: 'critical',
    },
    {
      name: 'Incidente de Segurança',
      triggerKeywords: ['assalto', 'invasão', 'invasao', 'roubo', 'furto', 'arrombamento'],
      urgencyLevel: 'critical',
    },
    {
      name: 'Vazamento Grave',
      triggerKeywords: ['vazamento grave', 'alagamento', 'vazamento grande'],
      urgencyLevel: 'high',
    },
    {
      name: 'Emergência Geral',
      triggerKeywords: ['emergência', 'emergencia', 'incêndio', 'incendio', 'acidente'],
      urgencyLevel: 'critical',
    }
  ];

  for (const rule of rules) {
    await prisma.escalationRule.create({
      data: {
        condominiumId: condominium.id,
        name: rule.name,
        triggerKeywords: rule.triggerKeywords,
        urgencyLevel: rule.urgencyLevel,
        dispatchGroupId: dispatchGroup.id,
      },
    });
  }
  console.log(`✅ Escalation Rules: ${rules.length} created`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Credentials:');
  console.log(`  Super Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`  Síndico: sindico@belavista.com / Sindico@123`);
  console.log(`  Zelador: zelador@belavista.com / Zelador@123`);
  console.log(`  Atendente: portaria@belavista.com / Atendente@123`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
