import { Server, Socket } from "socket.io";
import { AdminSocket, AUTH_PRIVILEGE, RiderSocket, UserSocket } from "../util/types";
import { handleAdminConnection } from "./admin";
import { handleRiderConnection } from "./rider";

export const handleSocketConnection = (io: Server) => async (socket: Socket) => {
    const role = (socket as UserSocket).role;

    console.log(`[@] LOG: Socket Connected with -- socket.id: ${socket.id}, socket.role: ${role}`);

    switch (role) {
        case AUTH_PRIVILEGE.RIDER:
            handleRiderConnection(io, socket as RiderSocket);
            break;
        case AUTH_PRIVILEGE.ADMIN:
        case AUTH_PRIVILEGE.SUPER_ADMIN:
            handleAdminConnection(io, socket as AdminSocket);
            break;
        default:
            throw "UNREACHABLE";
    }
};
