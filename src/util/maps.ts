import axios from "axios";
import { GOOGLE_MAPS_API_KEY } from "../config/config";
import fs from "fs";

import { LatLong, Matrix } from "./types";

export const geocodeAddress = async (address: string): Promise<LatLong> => {
    // https://developers.google.com/maps/documentation/geocoding/requests-geocoding
    const URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
    )}&key=${GOOGLE_MAPS_API_KEY}`;

    const { data } = await axios.get(URL);

    const { results, status } = data;

    if (status !== "OK") {
        console.error(data);
        console.log(address, URL);
        throw "[#] ERROR: STATUS returned not OK";
    }

    const result = results[0]; // Assumption: that the first match is the correct match

    if (!result.geometry || !result.geometry.location) {
        console.error(result);
        console.log(address);
        throw "[#] ERROR: location sub-object not found!";
    }

    return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
    };
};

export const getPointsLatLngString = (points: LatLong[], start: number, end: number) => {
    let latLngString = "";
    for (let i = start; i < Math.min(end, points.length); ++i) {
        if (i !== start) latLngString += "|";
        latLngString += `${points[i].latitude},${points[i].longitude}`;
    }
    return latLngString;
};

export const getBatchDistanceMatrix = async (
    origin: string,
    destination: string
): Promise<Matrix> => {
    // https://developers.google.com/maps/documentation/distance-matrix/distance-matrix
    const distanceMatrix: Array<Array<number>> = [];
    const timeMatrix: Array<Array<number>> = [];
    const URL = `https://maps.googleapis.com/maps/api/distancematrix/json?destinations=${encodeURIComponent(
        destination
    )}&origins=${encodeURIComponent(origin)}&key=${GOOGLE_MAPS_API_KEY}`;

    const { data } = await axios.get(URL);

    if (data.status !== "OK") {
        console.log(data);
        console.error(data.error_message);
        console.log('origin:', origin);
        console.log('destination:', destination);
        throw "[#] ERROR: STATUS returned not OK";
    }

    data.rows.forEach(({ elements }: any) => {
        const distRow: Array<number> = [];
        const timeRow: Array<number> = [];
        elements.forEach((element: any) => {
            if (element.status !== "OK") {
                console.log(origin, destination);
                console.dir(data, { depth: null });
                console.error(`[#] ERROR: Non OK Status received`);
                throw "Non OK Status received";
            }
            distRow.push(element.distance.value);
            timeRow.push(element.duration.value);
        });
        distanceMatrix.push(distRow);
        timeMatrix.push(timeRow);
    });

    return {
        distanceMatrix,
        timeMatrix,
    };
};

const create2DSquare = (length: number, def: number) => {
    return Array.from(new Array(length)).map(() => Array.from(new Array(length)).map(() => def));
};

type BatchMatrix = {
    i: number;
    j: number;
    d: Array<Array<number>>;
    t: Array<Array<number>>;
};
export const getDistanceMatrix = async (points: LatLong[]): Promise<Matrix> => {
    const matrices: Matrix = {
        distanceMatrix: create2DSquare(points.length, 1e18),
        timeMatrix: create2DSquare(points.length, 1e18),
    };

    const BATCH_SIZE = 10;
    let promises: Promise<BatchMatrix>[] = [];
    let responses: BatchMatrix[] = [];
    for (let i = 0; i < points.length; i += BATCH_SIZE) {
        const originString = getPointsLatLngString(points, i, i + BATCH_SIZE);

        const inf = 1e18;

        for (let j = 0; j < points.length; j += BATCH_SIZE) {
            const destinationString = getPointsLatLngString(points, j, j + BATCH_SIZE);
            const len = Math.min(BATCH_SIZE, points.length - j);
            promises.push(
                new Promise((resolve, reject) => {
                    getBatchDistanceMatrix(originString, destinationString)
                        .then(({ distanceMatrix: d, timeMatrix: t }) => {
                            console.log("resolved");
                            resolve({ i, j, d, t });
                        })
                        .catch((e) => {
                            const infArray = create2DSquare(len, inf);
                            console.error(`[#] ERROR at ${i}, ${j}: ${e}`);
                            reject({ i, j, d: infArray, t: infArray });
                        });
                })
            );
            if (promises.length === 1000 / (BATCH_SIZE * BATCH_SIZE)) {
                responses = [...responses, ...(await Promise.all(promises))];
                await new Promise((resolve) => setTimeout(resolve, 500));
                promises = [];
            }
        }
    }
    responses = [...responses, ...(await Promise.all(promises))];

    // Should be a lot faster :/

    for (const batchMatrix of responses) {
        const li = Math.min(batchMatrix.i + BATCH_SIZE, points.length);
        for (let i = batchMatrix.i; i < li; ++i) {
            const lj = Math.min(batchMatrix.j + BATCH_SIZE, points.length);
            for (let j = batchMatrix.j; j < lj; ++j) {
                matrices.distanceMatrix[i][j] = batchMatrix.d[i - batchMatrix.i][j - batchMatrix.j];
                matrices.timeMatrix[i][j] = batchMatrix.t[i - batchMatrix.i][j - batchMatrix.j];
            }
        }
    }

    return matrices;
};
