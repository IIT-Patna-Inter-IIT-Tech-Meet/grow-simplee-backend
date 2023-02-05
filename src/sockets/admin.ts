import { Server } from "socket.io";
import { AdminSocket } from "../util/types";

export const handleAdminConnection = async (io: Server, socket: AdminSocket) => {
    socket.join("admin");
};
