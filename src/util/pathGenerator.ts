import { exec } from "child_process";
import fs from "fs";
import util from "util";
import { geocodeAddress, getDistanceMatrix } from "./maps";
import { ItemAtom } from "./types";

const asyncExec = util.promisify(exec);

const VOLUME_CAPACITY_OF_VEHICLE = 500 * 500 * 1500; // 1.5 m * 0.5 m * 0.5 m
const WAREHOUSE_ADDRESS = "36, Off MG Road, Church Street, Bangalore";

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

export const generateRoutes = async (packages: Array<ItemAtom>, riderCount: number) => {
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
        edd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from today treated as infinity
        volume: 0,
    });

    // Form input
    const N = packages.length - 1;
    const M = riderCount;
    const wID = 0;
    const cap = VOLUME_CAPACITY_OF_VEHICLE;
    const vol = packages.map(({ volume }) => volume);

    const { distanceMatrix, timeMatrix } = await getDistanceMatrix(
        packages.map(({ latitude, longitude }) => ({ latitude, longitude }))
    );
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
        const solutionBuffer = buffer.toString().replace(/\r/g, "").split("solution\n\n")[1];

        const solution = solutionBuffer
            .trim()
            .split("\n")
            .map((x) => {
                const y = x.trim().split(" ");
                return y[0] === "" ? [] : y.map((num) => Number(num));
            });
        for (let i = solution.length; i < M; ++i) solution.push([]);

        // Return the formed Routes;
        return solution.map((riderRoute) => riderRoute.map((pointIdx) => packages[pointIdx]));
    } catch (e) {
        console.error(`[#] ERROR: Executable returned with: ${e}`);
        throw "Executable returned with non-zero exit-code";
    }
};

// export const tweakRoutesForPickup = () => {};
