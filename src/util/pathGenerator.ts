import { exec } from "child_process";
import fs from "fs";
import util from "util";
import { fetchPointsFromRoute } from "../controllers/routing";
import {
    geocodeAddress,
    getBatchDistanceMatrix,
    getDistanceMatrix,
    getPointsLatLngString,
} from "./maps";
import { routeRepository } from "./redis";
import { updateMissedPackages, updateRiderRoute } from "./routes";
import { PackageAtom } from "./types";

const asyncExec = util.promisify(exec);

const VOLUME_CAPACITY_OF_VEHICLE = 500 * 500 * 1500; // 1.5 m * 0.5 m * 0.5 m
const WAREHOUSE_ADDRESS = "36, Off MG Road, Church Street, Bangalore";

let IDMap: { [key: string]: number } = {};
let cachedDistanceMatrix: Array<Array<number>> = [];
let cachedTimeMatrix: Array<Array<number>> = [];

const invokeExpression = (EXECUTABLE: string, INPUT_FILE: string, OUTPUT_FILE: string) => {
    switch (process.platform) {
        case "win32":
            return `pwsh -c "cat ${INPUT_FILE} | ./${EXECUTABLE} > ${OUTPUT_FILE}"`;
        case "linux":
            return `./${EXECUTABLE} < ${INPUT_FILE} > ${OUTPUT_FILE}`;
        default:
            throw `Doesn't support ${process.platform} right now.`;
    }
};

export const generateRoutes = async (packages: PackageAtom[], riderCount: number) => {
    const GENERATOR_SOURCE_FILE = "routing.cpp";
    const GENERATOR = "routing.exe";
    const INPUT_FILE = "generator_input.txt";
    const OUTPUT_FILE = "generator_output.txt";

    if (!fs.existsSync(GENERATOR)) {
        if (!fs.existsSync(GENERATOR_SOURCE_FILE)) {
            console.error("[#] ERROR: Generator source file not found");
            throw "Generator source file not found";
        }

        const CMD = ["g++", "-o", GENERATOR, GENERATOR_SOURCE_FILE].join(" ");
        try {
            await asyncExec(CMD);
        } catch (_) {
            console.error("[#] ERROR: Can't compile!");
            throw "Can't compile!";
        }
    }

    const warehouseCoordinates = await geocodeAddress(WAREHOUSE_ADDRESS);

    packages.unshift({
        latitude: warehouseCoordinates.latitude,
        longitude: warehouseCoordinates.longitude,
        id: "root",
        delivery: true,
        edd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from today treated as infinity
        volume: 0,
    });

    packages.forEach((p, idx) => {
        IDMap[p.id] = idx;
    });

    // Form input
    const N = packages.length - 1;
    const M = riderCount;
    const wID = 0;
    const cap = VOLUME_CAPACITY_OF_VEHICLE;
    const vol = packages.map(({ volume }) => volume);

    let distanceMatrix = create2DSquare(packages.length, 0);
    let timeMatrix = create2DSquare(packages.length, 0);
    if (fs.existsSync("cache-banglore_dispatch.json") && formcachedmatrix("cache-banglore_dispatch.json")) {
        const idxMap: Array<number> = Array.from(new Array(packages.length)).map(() => 0);
        packages.forEach((pkg, idx) => {
            if (!(pkg.id in IDMap)) throw "ID doesn't exist in ID Map: " + pkg.id;
            idxMap[idx] = IDMap[pkg.id];
        });

        for (let i = 0; i < packages.length; ++i) {
            for (let j = 0; j < packages.length; ++j) {
                distanceMatrix[idxMap[i]][idxMap[j]] = cachedDistanceMatrix[i][j];
                timeMatrix[idxMap[i]][idxMap[j]] = cachedTimeMatrix[i][j];
            }
        }
    } else {
        const { distanceMatrix: d, timeMatrix: t } = await getDistanceMatrix(
            packages.map(({ latitude, longitude }) => ({ latitude, longitude }))
        );

        cachedDistanceMatrix = JSON.parse(JSON.stringify(distanceMatrix)) as Array<Array<number>>;
        cachedTimeMatrix = JSON.parse(JSON.stringify(timeMatrix)) as Array<Array<number>>;

        distanceMatrix = d;
        timeMatrix = t;
    }


    const eddPackages = packages.map(({ edd }) => Number(edd) - Date.now());

    const buffer = `${N}\n${M}\n${wID}\n${cap}\n${timeMatrix
        .map((x) => x.join(" "))
        .join("\n")}\n${distanceMatrix.map((x) => x.join(" ")).join("\n")}\n${eddPackages.join(
        " "
    )}\n${vol.join(" ")}`;

    fs.writeFileSync(INPUT_FILE, buffer);

    // Invoke executable to get routes
    const CMD = invokeExpression(GENERATOR, INPUT_FILE, OUTPUT_FILE);

    // Get output
    try {
        await asyncExec(CMD);
        const buffer = fs.readFileSync(OUTPUT_FILE);
        const solutionBuffer = buffer.toString().replace(/\r/g, "").split("\n");

        const solution: Array<Array<number>> = [];
        for (let i = 0; i < solutionBuffer.length; ++i) {
            if (solutionBuffer[i].trim() === "") continue;
            const daysScheduled = Number(solutionBuffer[i].trim());
            if (daysScheduled > 0) {
                solution.push(
                    solutionBuffer[i + 1]
                        .trim()
                        .split(" ")
                        .map((x) => Number(x))
                );
            } else solution.push([]);
            i += daysScheduled;
        }

        const cacheJSON = {
            idmap: IDMap,
            n: packages.length,
            distanceMatrix,
            timeMatrix
        }
        fs.writeFileSync(`cache-latest.json`, JSON.stringify(cacheJSON));

        // Return the formed Routes;
        return solution.map((riderRoute) => riderRoute.map((pointIdx) => packages[pointIdx]));
    } catch (e) {
        console.error(`[#] ERROR: Executable returned with: ${e}`);
        throw "Executable returned with non-zero exit-code";
    }
};

const formcachedmatrix = (file = "cache-latest.json") => {
    if (fs.existsSync(file)) {
        const cacheBuffer = JSON.parse(fs
            .readFileSync("cache-latest.json")
            .toString())

        IDMap = cacheBuffer.idmap;
        cachedDistanceMatrix = cacheBuffer.distanceMatrix
        cachedTimeMatrix = cacheBuffer.timeMatrix

        return true;
    } else if (cachedDistanceMatrix.length !== 0) return true;
    else return false;
};

const create2DSquare = (length: number, def: number) => {
    return Array.from(new Array(length)).map(() => Array.from(new Array(length)).map(() => def));
};

export const tweakRoutesForPickup = async (
    packages: PackageAtom[],
    riderCount: number,
    newPickup: PackageAtom
) => {
    const INSERTER_SOURCE_FILE = "insertion.cpp";
    const INSERTER = "insertion.exe";
    const INPUT_FILE = "insertion_input.txt";
    const OUTPUT_FILE = "insertion_output.txt";

    if (!fs.existsSync(INSERTER)) {
        if (!fs.existsSync(INSERTER_SOURCE_FILE)) {
            console.error("[#] ERROR: Generator source file not found");
            throw "Generator source file not found";
        }

        const CMD = ["g++", "-o", INSERTER, INSERTER_SOURCE_FILE].join(" ");
        try {
            await asyncExec(CMD);
        } catch (_) {
            console.error("[#] ERROR: Can't compile!");
            throw "Can't compile!";
        }
    }

    const routesEntities = await routeRepository.search().return.all();

    const N = packages.length + 1;
    const M = riderCount;
    const wID = 0;
    const cap = VOLUME_CAPACITY_OF_VEHICLE;
    const vol = [0, ...packages.map(({ volume }) => volume), 0];
    const eddPackages = [
        0, ...packages.map(({ edd }) => edd.getDate() - new Date(Date.now()).getDate() + 1),
        1,
    ];

    // const { distanceMatrix, timeMatrix } = await getDistanceMatrix(
    //     packages.map(({ latitude, longitude }) => ({ latitude, longitude }))
    // );
    // form distanceMatrix and timeMatrix
    const distanceMatrix: Array<Array<number>> = create2DSquare(packages.length + 2, 0);
    const timeMatrix: Array<Array<number>> = create2DSquare(packages.length + 2, 0);

    const warehouseCoordinates = await geocodeAddress(WAREHOUSE_ADDRESS);

    packages.unshift({
        latitude: warehouseCoordinates.latitude,
        longitude: warehouseCoordinates.longitude,
        id: "root",
        delivery: true,
        edd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from today treated as infinity
        volume: 0,
    });

    if (!formcachedmatrix()) {
        throw "Possibly no routes found!";
    }

    const idxMap: Array<number> = Array.from(new Array(packages.length)).map(() => 0);
    packages.forEach((pkg, idx) => {
        if (!(pkg.id in IDMap)) throw "ID doesn't exist in ID Map: " + pkg.id;
        idxMap[idx] = IDMap[pkg.id];
    });

    for (let i = 0; i < packages.length; ++i) {
        for (let j = 0; j < packages.length; ++j) {
            distanceMatrix[idxMap[i]][idxMap[j]] = cachedDistanceMatrix[i][j];
            timeMatrix[idxMap[i]][idxMap[j]] = cachedTimeMatrix[i][j];
        }
    }

    const newPickupLatLng = { latitude: newPickup.latitude, longitude: newPickup.longitude };
    const pointString = getPointsLatLngString([newPickupLatLng], 0, 1);

    let dRow: number[] = [],
        tRow: number[] = [];
    let dCol: number[] = [],
        tCol: number[] = [];
    const BATCH = 19;
    for (let i = 0; i < packages.length; i += BATCH) {
        const subset = packages
            .slice(i, i + BATCH)
            .map(({ latitude, longitude }) => ({ latitude, longitude }));

        if (subset.length === 0) continue;

        const pointsString = getPointsLatLngString(subset, 0, subset.length);
        const { distanceMatrix: dr, timeMatrix: tr } = await getBatchDistanceMatrix(
            pointString,
            pointsString
        );
        dRow = [...dRow, ...dr[0]];
        tRow = [...tRow, ...tr[0]];

        const { distanceMatrix: dc, timeMatrix: tc } = await getBatchDistanceMatrix(
            pointsString,
            pointString
        );
        dCol = [...dCol, ...(dc.map((x) => x[0]))];
        tCol = [...tCol, ...(tc.map((x) => x[0]))];
    }


    for (let i = 0; i < packages.length; ++i) {
        distanceMatrix[i][packages.length] = dCol[i];
        distanceMatrix[packages.length][i] = dRow[i];

        timeMatrix[i][packages.length] = tCol[i];
        timeMatrix[packages.length][i] = tRow[i];
    }

    console.log(distanceMatrix[packages.length], dRow);
    distanceMatrix[packages.length][packages.length] = 0;
    timeMatrix[packages.length][packages.length] = 0;
    

    IDMap = {};
    packages.forEach(({ id }, idx) => {
        IDMap[id] = idx;
    });



    cachedDistanceMatrix = JSON.parse(JSON.stringify(distanceMatrix)) as Array<Array<number>>;
    cachedTimeMatrix = JSON.parse(JSON.stringify(timeMatrix)) as Array<Array<number>>;

    const routes = routesEntities.map((routeEntity) => {
        return fetchPointsFromRoute(routeEntity).map((x) => IDMap[x.itemId]);
    });


    for (let i = routes.length; i < riderCount; ++i) routes.push([]);

    const start = new Date(Date.now());
    start.setUTCHours(9, 0, 0, 0);
    const elapsedTime = Date.now() - Number(start);

    const bufferRoutes = routes.map((x) => [x.length, ...x]);

    const buffer = `${N}\n${M}\n${wID}\n${cap}\n${timeMatrix
        .map((x) => x.join(" "))
        .join("\n")}\n${distanceMatrix.map((x) => x.join(" ")).join("\n")}\n${eddPackages.join(
        " "
    )}\n${vol.join(" ")}\n${bufferRoutes.map((x) => x.join(" ")).join("\n")}\n${elapsedTime}\n${N - 1}`;

    fs.writeFileSync(INPUT_FILE, buffer);


    // Invoke executable to get routes
    const CMD = invokeExpression(INSERTER, INPUT_FILE, OUTPUT_FILE);

    try {
        await asyncExec(CMD);
        const buffer = fs.readFileSync(OUTPUT_FILE);
        const solutionBuffer = buffer.toString().replace(/\r/g, "").split("\n");

        // const solution: Array<Array<number>> = [];
        const riderRouteIdx = Number(solutionBuffer[0].trim());

        const pkgs = solutionBuffer[1]
            .trim()
            .split(" ")
            .map((x) => packages[Number(x)]);

        const missedPkgs = solutionBuffer[2]
            .trim()
            .split(" ")
            .filter((x) => x.trim() !== "0")
            .map((x) => packages[Number(x)]);

        console.log(pkgs, missedPkgs);

        const changedRider = routesEntities[riderRouteIdx].riderId;

        updateRiderRoute(changedRider, pkgs);
        updateMissedPackages(missedPkgs);

        const cacheJSON = {
            idmap: IDMap,
            n: packages.length,
            distanceMatrix,
            timeMatrix
        }
        fs.writeFileSync(`cache-latest.json`, JSON.stringify(cacheJSON));

        // Return the id of the rider to which it is assigned
        return changedRider;
    } catch (e) {
        console.error(`[#] ERROR: Executable returned with: ${e}`);
        throw "Executable returned with non-zero exit-code";
    }
};
