const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const programs = await prisma.program.findMany();
    console.log("Total Programs:", programs.length);
    programs.forEach(p => {
        console.log(`ID: ${p.id}, Name: ${p.name}, Theme:`, p.theme);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
