import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const emplacements = [
  {
    nom: 'Cuisine - Étagères de l\'Atelier',
    description: 'Espace de stockage dans la cuisine, étagères de l\'atelier',
    zone: 'Cuisine',
    allee: null,
    etagere: 'Étagères de l\'Atelier',
  },
  {
    nom: 'Accueil - Exposition',
    description: 'Zone d\'exposition à l\'accueil',
    zone: 'Accueil',
    allee: null,
    etagere: 'Exposition',
  },
  {
    nom: 'Bureau Techniciens - Armoire',
    description: 'Armoire de stockage dans le bureau des techniciens',
    zone: 'Bureau Techniciens',
    allee: null,
    etagere: 'Armoire',
  },
  {
    nom: 'Bureau du Boss - Armoire',
    description: 'Armoire de stockage dans le bureau du boss',
    zone: 'Bureau du Boss',
    allee: null,
    etagere: 'Armoire',
  },
];

async function main() {
  console.log('Seeding emplacements...');
  
  for (const emplacement of emplacements) {
    const existing = await prisma.emplacement.findUnique({
      where: { nom: emplacement.nom },
    });
    
    if (!existing) {
      await prisma.emplacement.create({
        data: emplacement,
      });
      console.log(`Created: ${emplacement.nom}`);
    } else {
      console.log(`Already exists: ${emplacement.nom}`);
    }
  }
  
  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
