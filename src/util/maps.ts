import axios from "axios";
import { GOOGLE_MAPS_API_KEY } from "../config/config";

import { LatLong } from "./types";

export const geocodeAddress = async (address: string): Promise<LatLong> => {
    // https://developers.google.com/maps/documentation/geocoding/requests-geocoding
    const URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURI(
        address
    )}&key=${GOOGLE_MAPS_API_KEY}`;

    const { data } = await axios.get(URL);

    const { results, status } = data;

    if (status !== "OK") {
        console.error(data);
        throw "[#] ERROR: STATUS returned not OK";
    }

    const result = results[0]; // Assumption: that the first match is the correct match

    if (!result.geometry || !result.geometry.location) {
        console.error(result);
        throw "[#] ERROR: location sub-object not found!";
    }

    return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
    };
};
