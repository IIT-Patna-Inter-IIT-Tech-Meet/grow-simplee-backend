import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
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

//{
//    "name": "name [required]",
//    "email": "test@test.com",
//    "password": "test",
//    "phoneno": "93480232874",
//    "drivingLicense": "<url>",
//    "bloodGroup": "A_POSITIVE"
//}
const generateRider = async (email: string, vehicleId: string) => {
    const name = `name:${email.substring(0, 5)}`,
        password =  "password";

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.rider.upsert({
        where: { email },
        update: {},
        create: {
            id: uuidv4(),
            email,
            password: hashedPassword,
            name,
            onduty: false,
            vehicleId
        },
    });

    console.log(`Added Rider with email: ${email}`)
}

const main = async () => {
    await generateSuperAdmin();

    await generateRider("test@test.com", "DL 9CY 3366")
    await generateRider("test1@test.com", "DL 8EA 7832")
    await generateRider("test2@test.com", "DL 9CX 7218")
    await generateRider("test3@test.com", "DL 8DY 1276")

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
