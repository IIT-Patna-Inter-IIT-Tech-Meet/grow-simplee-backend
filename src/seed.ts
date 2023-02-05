import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD } from "./config/config";

const prisma = new PrismaClient();

const generateSuperAdmin = async () => {
    const email = SUPER_ADMIN_EMAIL || "admin@admin.com",
        password = SUPER_ADMIN_PASSWORD || "password";

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const superAdmin = await prisma.admin.upsert({
        where: { email },
        update: {},
        create: {
            email,
            password: hashedPassword,
            name: "SUPER_ADMIN",
            createdAt: new Date(Date.now()),
            superAdmin: true,
        },
    });

    console.log(superAdmin);
};

const main = async () => {
    await generateSuperAdmin();

    // Add more seedings to the database
};

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(`[#] ERROR: ${e}`);
        await prisma.$disconnect();
    });
