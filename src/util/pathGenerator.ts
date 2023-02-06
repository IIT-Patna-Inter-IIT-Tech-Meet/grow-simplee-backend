import fs from "fs";
import { getDistanceMatrix } from "./maps";

type ItemAtom = {
    latitude: number;
    longitude: number;
    id: string;
    edd: Date;
    volume: number;
};

const VOLUME_CAPACITY_OF_VEHICLE = 1000;

export const generateRoutes = async (packages: Array<ItemAtom>, riderCount: number) => {
    // TODO: generate route by calling the executable
    // const GENERATOR_PATH = "/home/app/generator";
    // if (!fs.existsSync(GENERATOR_PATH)) {
    //     console.error("[#] ERROR: Generator executable not found");
    //     throw "Generator executable not found";
    // }

    // Form input
    const N = packages.length;
    const M = riderCount;
    const wID = 0;
    const cap = VOLUME_CAPACITY_OF_VEHICLE;
    const vol = packages.map(({ volume }) => volume);

    const { distanceMatrix, timeMatrix } = await getDistanceMatrix(
        packages.map(({ latitude, longitude }) => ({ latitude, longitude }))
    );
    const eddPackages = packages.map(({ edd }) => Number(edd));

    const buffer = `${N} ${M}\n${wID}\n${cap}\n${distanceMatrix
        .map((x) => x.join(" "))
        .join("\n")}\n${timeMatrix.map((x) => x.join(" ")).join("\n")}\n${eddPackages.join(
        " "
    )}\n${vol.join(" ")}`;

    const INPUT_FILE = "input.txt";
    fs.writeFileSync(INPUT_FILE, buffer);
};

// export const tweakRoutesForPickup = () => {};
