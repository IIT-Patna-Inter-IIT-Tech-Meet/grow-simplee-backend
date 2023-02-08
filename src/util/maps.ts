import axios from "axios";
import { GOOGLE_MAPS_API_KEY } from "../config/config";

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

const getPointsLatLngString = (points: LatLong[], start: number, end: number) => {
    let latLngString = "";
    for (let i = start; i < Math.min(end, points.length); ++i) {
        if (i !== start) latLngString += "|";
        latLngString += `${points[i].latitude},${points[i].longitude}`;
    }
    return latLngString;
};

const getBatchDistanceMatrix = async (origin: string, destination: string): Promise<Matrix> => {
    // https://developers.google.com/maps/documentation/distance-matrix/distance-matrix
    const distanceMatrix: Array<Array<number>> = [];
    const timeMatrix: Array<Array<number>> = [];
    const URL = `https://maps.googleapis.com/maps/api/distancematrix/json?destinations=${encodeURIComponent(
        destination
    )}&origins=${encodeURIComponent(origin)}&key=${GOOGLE_MAPS_API_KEY}`;

    const { data } = await axios.get(URL);

    if (data.status !== "OK") {
        console.error(data.error_message);
        throw "[#] ERROR: STATUS returned not OK";
    }

    data.rows.forEach(({ elements }: any) => {
        const distRow: Array<number> = [];
        const timeRow: Array<number> = [];
        elements.forEach((element: any) => {
            if (element.status !== "OK") {
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

export const getDistanceMatrix = async (points: LatLong[]): Promise<Matrix> => {
    const matrices: Matrix = { distanceMatrix: [], timeMatrix: [] };
    for (let j = 0; j < points.length; ++j)
        matrices.distanceMatrix.push([]), matrices.timeMatrix.push([]);

    const BATCH_SIZE = 25;
    for (let i = 0; i < points.length; i += BATCH_SIZE) {
        const diff = Math.min(BATCH_SIZE, points.length - i);
        const originString = getPointsLatLngString(points, i, i + BATCH_SIZE);

        const dRows: Array<Array<number>> = [];
        const tRows: Array<Array<number>> = [];
        for (let j = 0; j < diff; ++j) dRows.push([]), tRows.push([]);

        for (let j = 0; j < points.length; j += BATCH_SIZE) {
            const destinationString = getPointsLatLngString(points, j, j + BATCH_SIZE);
            const { distanceMatrix: d, timeMatrix: t } = await getBatchDistanceMatrix(
                originString,
                destinationString
            );

            d.forEach((v, idx) => {
                dRows[idx] = [...dRows[idx], ...v];
            });
            t.forEach((v, idx) => {
                tRows[idx] = [...tRows[idx], ...v];
            });
        }

        dRows.forEach((row, idx) => {
            matrices.distanceMatrix[idx] = matrices.distanceMatrix[idx].concat(row);
        });
        tRows.forEach((row, idx) => {
            matrices.timeMatrix[idx] = matrices.timeMatrix[idx].concat(row);
        });
    }
    return matrices;
};
