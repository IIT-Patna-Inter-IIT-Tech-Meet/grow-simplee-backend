import { Customer, PrismaClient, Product } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD } from "./config/config";
import { geocodeAddress } from "./util/maps";
import { z } from "zod";
import reader from "xlsx";
import fs from "fs";

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
            onduty: true,
            vehicleId,
        },
    });

    console.log(`Added Rider with email: ${email}`);
};

const generateProduct = async (sku: string | undefined): Promise<Product> => {
    const SKU = sku ? sku : `SKU${randomInteger(10000, 99999)}`;
    try {
        const product = await prisma.product.upsert({
            where: { SKU: SKU },
            update: {},
            create: {
                SKU: SKU,
                name: `prod:${SKU.substring(0, 5)}`,
                desc: `prod:desc:super-desc-${SKU.substring(0, 5)}`,
            },
        });
        return product;
    } catch (e) {
        console.log("ERROR: ", sku, e);
        throw "Mast error";
    }
};

const generateCustomer = async (
    address: string,
    custName: string | undefined,
    latitude: number | undefined,
    longitude: number | undefined
): Promise<Customer> => {
    const latLng =
        !latitude || !longitude ? await geocodeAddress(address) : { latitude, longitude };

    const name = custName ? custName : `cust:name:${randomInteger(10000, 50000)}`;
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

const formDate = (edd: string | undefined) => {
    if (!edd) {
        return new Date(Date.now() + 1000 * 60 * randomInteger(24 * 60, 24 * 60 * 5));
    }

    const d = new Date(edd);
    d.setUTCHours(20, 0, 0, 0); // 8 o'clock in the evening
    return d;
};

const generateDelivery = async (
    address: string,
    name: string | undefined,
    awb: string | undefined,
    edd: string | undefined,
    latitude: number | undefined,
    longitude: number | undefined
) => {
    const EDD = formDate(edd);
    const customer = await generateCustomer(address, name, latitude, longitude);

    const delivery = await prisma.delivery.create({
        data: {
            id: uuidv4().substring(0, 20),
            AWB: awb ? awb : `delivery:awb:${customer.id}`,
            EDD,
            customerId: customer.id,
        },
        include: { customer: true },
    });

    console.log(`Delivery record created with AWB: ${delivery.AWB}`);

    return delivery;
};

const generatePackage = async (
    address: string,
    sku: string | undefined,
    awb: string | undefined,
    edd: string | undefined,
    name: string | undefined,
    latitude: number | undefined,
    longitude: number | undefined
) => {
    const product = await generateProduct(sku);
    const delivery = await generateDelivery(address, name, awb, edd, latitude, longitude);

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
    return { latitude: delivery.customer.latitude, longitude: delivery.customer.longitude };
};


const xlDataSchema = z.array(
    z.object({
        address: z.string(),
        AWB: z.number(),
        names: z.string(),
        product_id: z.string(),
        EDD: z.string(),
    })
);
const cachedDataSchema = z.array(
    z.object({
        address: z.string(),
        AWB: z.number(),
        names: z.string(),
        product_id: z.string(),
        EDD: z.string(),
        latitude: z.number(),
        longitude: z.number(),
    })
);
const localTestingDataset = () => {
    const addresses: string[] = [
        "1, 24th Main Rd, 1st Phase, Girinagar, KR Layout, Muneshwara T-Block, JP Nagar, Bangalore",
        "67, 15th Cross, 6th B Main, JP Nagar, Bangalore",
        "281, 2nd Floor, 15th Cross, 5th Phase, JP Nagar, Bangalore",
        "Cross Roads Inn, 827, Near RV Dental College Compound, 24th Main, 12th Cross, JP Nagar, Bangalore",
        "21, 24th Main Road, 6th Phase, JP Nagar, Bangalore",
        "99/4, Nataraja Layout, 7th Phase, JP Nagar, Bangalore",
    ];

    addresses.forEach(async (address) => {
        await generatePackage(
            address,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined
        );
    });
};
const useCachedDataset = async (cachedDataset: string) => {
    const buffer = fs.readFileSync(cachedDataset).toString();
    const jsonData = cachedDataSchema.safeParse(JSON.parse(buffer));

    if (!jsonData.success) {
        console.error("ERROR parsing cached dataset");
        throw "Could not parse cached dataset";
    }

    const records = jsonData.data;

    const promises: Promise<boolean>[] = [];
    // address: string,
    // sku: string | undefined,
    // awb: string | undefined,
    // edd: string | undefined,
    // name: string | undefined,
    // latitude: number | undefined,
    // longitude: number | undefined
    for (const record of records) {
        await generatePackage(
            record.address,
            record.product_id,
            record.AWB.toString(),
            record.EDD,
            record.names,
            record.latitude,
            record.longitude
        );
    }

    const response = await Promise.all(promises);

    if (response.includes(false)) {
        console.error("BRUHHHH");
    }
};
const testDataset = async (DATASET_FILE: string) => {
    if (fs.existsSync(`cache.${DATASET_FILE}`)) {
        await useCachedDataset(`cache.${DATASET_FILE}`);
        return;
    }

    const file = reader.readFile(DATASET_FILE);
    const sheets = file.SheetNames;

    console.assert(sheets.length === 1 && sheets[0] === "Sheet1");

    const jsonData = xlDataSchema.safeParse(
        reader.utils.sheet_to_json(file.Sheets[file.SheetNames[0]])
    );
    if (!jsonData.success) {
        console.dir(jsonData, { depth: null });
        throw "Could not parse the file properly :/.";
    }

    const records = jsonData.data;

    const parsedRecords: z.infer<typeof cachedDataSchema> = [];
    const promises: Promise<boolean>[] = [];
    // address: string,
    // sku: string | undefined,
    // awb: string | undefined,
    // edd: string | undefined,
    // name: string | undefined,
    // latitude: number | undefined,
    // longitude: number | undefined
    for (const record of records) {
        const latLng = await generatePackage(
            record.address,
            record.product_id,
            record.AWB.toString(),
            record.EDD,
            record.names,
            undefined,
            undefined
        );
        parsedRecords.push({ ...record, ...latLng });
    }

    const response = await Promise.all(promises);
    fs.writeFileSync(`cache.${DATASET_FILE}`, JSON.stringify(parsedRecords));

    if (response.includes(false)) {
        console.error("BRUHHHH");
    }
};

const main = async () => {
    await generateSuperAdmin();

    await generateRider("test@test.com", "DL 9CY 3366");
    await generateRider("test1@test.com", "DL 8EA 7832");
    await generateRider("test2@test.com", "DL 9CX 7218");
    await generateRider("test3@test.com", "DL 8DY 1276");

    localTestingDataset();
    // testDataset("bangalore dispatch address.xlsx");
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
