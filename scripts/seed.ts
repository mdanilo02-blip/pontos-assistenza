import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@assistenza.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@assistenza.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ATIVO,
    },
  });
  console.log('Admin user created:', adminUser.email);

  // Create test professional user
  const testUserPassword = await bcrypt.hash('johndoe123', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@doe.com',
      password: testUserPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ATIVO,
      crm: '12345-PI',
    },
  });
  console.log('Test user created:', testUser.email);

  // Create Hospital 1 - São Raimundo Nonato
  const hospitalSRN = await prisma.hospital.upsert({
    where: { id: 'hospital-srn' },
    update: {
      latitude: -9.0157,
      longitude: -42.6989,
    },
    create: {
      id: 'hospital-srn',
      name: 'Hospital Regional Senador José Cândido Ferraz',
      address: 'Rua Capitão Newton Rubens N 1351, Aldeias',
      city: 'São Raimundo Nonato',
      state: 'PI',
      cep: '64770-000',
      latitude: -9.0157,
      longitude: -42.6989,
    },
  });
  console.log('Hospital created:', hospitalSRN.name);

  // Create Hospital 2 - Valença
  const hospitalValenca = await prisma.hospital.upsert({
    where: { id: 'hospital-valenca' },
    update: {
      latitude: -6.3986,
      longitude: -41.7511,
    },
    create: {
      id: 'hospital-valenca',
      name: 'Hospital Regional Eustáquio Portela',
      address: 'Av. Santos Dumont, S/N',
      city: 'Valença',
      state: 'PI',
      cep: '64300-000',
      latitude: -6.3986,
      longitude: -41.7511,
    },
  });
  console.log('Hospital created:', hospitalValenca.name);

  // Create Hospital 3 - Mocambinho (Teresina)
  const hospitalMocambinho = await prisma.hospital.upsert({
    where: { id: 'hospital-mocambinho' },
    update: {
      latitude: -5.0563,
      longitude: -42.7789,
    },
    create: {
      id: 'hospital-mocambinho',
      name: 'Unidade Integrada do Mocambinho',
      address: 'Av. Pref. Freitas Neto, s/n, Mocambinho',
      city: 'Teresina',
      state: 'PI',
      cep: '64010-100',
      latitude: -5.0563,
      longitude: -42.7789,
    },
  });
  console.log('Hospital created:', hospitalMocambinho.name);

  // Create Groups for Hospital Valença
  const valencaGroups = [
    { name: 'Ortopedista Plantonista', description: 'Plantão de ortopedia' },
    { name: 'Centro Cirúrgico', description: 'Equipe do centro cirúrgico' },
    { name: 'Coordenação', description: 'Coordenação geral' },
  ];

  for (const group of valencaGroups) {
    await prisma.group.upsert({
      where: { id: `${hospitalValenca.id}-${group.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `${hospitalValenca.id}-${group.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: group.name,
        description: group.description,
        hospitalId: hospitalValenca.id,
      },
    });
    console.log('Group created:', group.name, 'for', hospitalValenca.name);
  }

  // Create Groups for Hospital São Raimundo Nonato
  const srnGroups = [
    { name: 'Plantonista Ortopedia', description: 'Plantão de ortopedia' },
    { name: 'Sobreaviso Ortopedia', description: 'Sobreaviso de ortopedia' },
    { name: 'Coordenação Ortopedia', description: 'Coordenação de ortopedia' },
    { name: 'Plantonista Cirurgia Geral', description: 'Plantão de cirurgia geral' },
    { name: 'Sobreaviso Cirurgia Geral', description: 'Sobreaviso de cirurgia geral' },
    { name: 'Coordenação Cirurgia Geral', description: 'Coordenação de cirurgia geral' },
  ];

  for (const group of srnGroups) {
    await prisma.group.upsert({
      where: { id: `${hospitalSRN.id}-${group.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `${hospitalSRN.id}-${group.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: group.name,
        description: group.description,
        hospitalId: hospitalSRN.id,
      },
    });
    console.log('Group created:', group.name, 'for', hospitalSRN.name);
  }

  // Create Groups for Hospital Mocambinho
  const mocambinhoGroups = [
    { name: 'Plantão Geral', description: 'Plantão geral' },
    { name: 'Centro Cirúrgico', description: 'Equipe do centro cirúrgico' },
    { name: 'Coordenação', description: 'Coordenação geral' },
  ];

  for (const group of mocambinhoGroups) {
    await prisma.group.upsert({
      where: { id: `${hospitalMocambinho.id}-${group.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `${hospitalMocambinho.id}-${group.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: group.name,
        description: group.description,
        hospitalId: hospitalMocambinho.id,
      },
    });
    console.log('Group created:', group.name, 'for', hospitalMocambinho.name);
  }

  // Import SIGTAP Procedures
  const proceduresPath = path.join(__dirname, '..', 'data', 'procedures.json');
  if (fs.existsSync(proceduresPath)) {
    const proceduresData = JSON.parse(fs.readFileSync(proceduresPath, 'utf-8'));
    console.log(`Importing ${proceduresData.length} procedures...`);
    
    for (const proc of proceduresData) {
      await prisma.procedure.upsert({
        where: { code: proc.code },
        update: {
          name: proc.name,
          value: proc.value,
        },
        create: {
          name: proc.name,
          code: proc.code,
          value: proc.value,
        },
      });
    }
    console.log('Procedures imported successfully!');
  } else {
    console.log('Procedures file not found, skipping...');
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
