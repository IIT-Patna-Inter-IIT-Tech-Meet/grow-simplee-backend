import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const main = async () => {
    const d = await prisma.delivery.findMany({
        select: { id: true, EDD: true },
    });

    for (const x of d) {
        const newEDD = new Date(x.EDD);
        newEDD.setDate(newEDD.getDate() + 5);
        newEDD.setMonth(1);
        console.log(newEDD);
        await prisma.delivery.update({
            where: { id: x.id },
            data: {
                EDD: newEDD,
            },
        });
    }
};

main()
    .then(() => {
        console.log("DONE");
    })
    .catch(() => {
        console.log("ERROR");
    });
