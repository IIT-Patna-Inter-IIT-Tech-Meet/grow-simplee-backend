import { Customer, PrismaClient, Product } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD } from "./config/config";
import { geocodeAddress } from "./util/maps";

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

const randomInteger = (start: number, end: number) => {
    return Math.floor(start + Math.random() * (end - start));
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
        password = "password";

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
            vehicleId,
        },
    });

    console.log(`Added Rider with email: ${email}`);
};

const generateProduct = async (): Promise<Product> => {
    const SKU = `SKU${randomInteger(10000, 99999)}`;
    const product = await prisma.product.upsert({
        where: { SKU },
        update: {},
        create: {
            SKU: SKU,
            name: `prod:${SKU.substring(0, 5)}`,
            desc: `prod:desc:super-desc-${SKU.substring(0, 5)}`,
        },
    });
    return product;
};

const generateCustomer = async (address: string): Promise<Customer> => {
    const latLng = await geocodeAddress(address);

    const name = `cust:name:${randomInteger(10000, 50000)}`;
    const customer = await prisma.customer.upsert({
        where: { name_address: { name, address: address } },
        update: {},
        create: {
            name,
            address,
            phoneno: `99999${randomInteger(1000, 9999)}`,
            latitude: latLng.latitude,
            longitude: latLng.longitude,
        },
    });

    return customer;
};

const generateDelivery = async (address: string) => {
    const EDD = new Date(Date.now() + 1000 * 60 * randomInteger(24 * 60, 24 * 60 * 5));
    const customer = await generateCustomer(address);
    const delivery = await prisma.delivery.create({
        data: {
            id: uuidv4().substring(0, 20),
            AWB: `delivery:awb:${customer.id}`,
            EDD,
            customerId: customer.id,
        },
    });

    console.log(`Delivery record created with AWB: ${delivery.AWB}`);

    return delivery;
};

const generatePackage = async (address: string) => {
    const product = await generateProduct();
    const delivery = await generateDelivery(address);

    const inventoryItem = await prisma.inventoryItem.create({
        data: {
            id: uuidv4(),
            productId: product.SKU,
            shipped: false,
            deliveryId: delivery.id,
            length: randomInteger(10, 50),
            breadth: randomInteger(3, 40),
            height: randomInteger(1, 20),
            weight: randomInteger(20, 60),
        },
    });

    console.log(`inventory item added with with id: ${inventoryItem.id}`);
};

const main = async () => {
    await generateSuperAdmin();

    await generateRider("test@test.com", "DL 9CY 3366");
    await generateRider("test1@test.com", "DL 8EA 7832");
    await generateRider("test2@test.com", "DL 9CX 7218");
    await generateRider("test3@test.com", "DL 8DY 1276");

    const addresses: string[] = [
        "1, 24th Main Rd, 1st Phase, Girinagar, KR Layout, Muneshwara T-Block, JP Nagar, Bangalore",
        "67, 15th Cross, 6th B Main, JP Nagar, Bangalore",
        "281, 2nd Floor, 15th Cross, 5th Phase, JP Nagar, Bangalore",
        "Cross Roads Inn, 827, Near RV Dental College Compound, 24th Main, 12th Cross, JP Nagar, Bangalore",
        "21, 24th Main Road, 6th Phase, JP Nagar, Bangalore",
        "99/4, Nataraja Layout, 7th Phase, JP Nagar, Bangalore",
    ];

    addresses.forEach(async (address) => {
        await generatePackage(address);
    });

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
