
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Starting cleanup of orphaned groups...');

        // 1. Fetch all groups with their creatorId
        const groups = await prisma.group.findMany({
            select: {
                id: true,
                name: true,
                creatorId: true
            }
        });

        console.log(`Found ${groups.length} total groups.`);

        let deletedCount = 0;

        // 2. Check each group
        for (const group of groups) {
            const creator = await prisma.user.findUnique({
                where: { id: group.creatorId }
            });

            if (!creator) {
                console.log(`Group "${group.name}" (ID: ${group.id}) has missing creator (ID: ${group.creatorId}). Deleting...`);
                await prisma.group.delete({
                    where: { id: group.id }
                });
                deletedCount++;
            }
        }

        console.log(`Cleanup complete. Deleted ${deletedCount} orphaned groups.`);

    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
