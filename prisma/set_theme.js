const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const theme = {
        primary: '#FF0000', // RED for visibility
        accent: '#FFFF00', // YELLOW
        background: '#000000',
        surface: '#111111'
    };

    await prisma.program.update({
        where: { id: 1 },
        data: { theme }
    });

    console.log("Updated Program 1 with RED/YELLOW theme.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
