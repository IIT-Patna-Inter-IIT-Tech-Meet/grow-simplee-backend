import { Server } from "socket.io";
import { AdminSocket } from "../util/types";

export const handleAdminConnection = async (io: Server, socket: AdminSocket) => {
    // make all admins join `admin` room
    socket.join("admin");
};
