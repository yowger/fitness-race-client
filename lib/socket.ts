import { io, Socket } from "socket.io-client"

let socket: Socket

const SERVER_URL = "http://10.0.2.2:4000"

export const initSocket = (userId: string) => {
    socket = io(SERVER_URL, {
        query: { userId },
    })

    socket.on("connect", () => console.log("Connected to server:", socket.id))
    socket.on("disconnect", () => console.log("Disconnected"))

    return socket
}

export const getSocket = () => socket
