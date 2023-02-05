import { Server } from "socket.io";
import { RiderGeolocation } from "../util/redis";
import { AdminSocket } from "../util/types";

export const handleAdminConnection = async (io: Server, socket: AdminSocket) => {
    // make all admins join `admin` room
    socket.join("admin");

    socket.on("rider:move", (riderEntity: RiderGeolocation) => {
        console.log(riderEntity);
    });
};
