import { io, Socket } from "socket.io-client"

// let socket: Socket

// export const initSocket = (userId: string) => {
//     socket = io(SERVER_URL, {
//         query: { userId },
//     })

//     socket.on("connect", () => console.log("Connected to server:", socket.id))
//     socket.on("disconnect", () => console.log("Disconnected"))

//     return socket
// }

// export const getSocket = () => socket

// testing
// const SERVER_URL = "http://10.0.2.2:4000"
// const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET as string
const SOCKET_URL = "https://fitness-race-api.onrender.com"
const SERVER_URL = SOCKET_URL

let socket: Socket | null = null

export const getSocket = () => {
    if (!socket) {
        socket = io(SERVER_URL, {
            transports: ["websocket"],
            forceNew: false,
            reconnection: true,
        })

        socket.on("connect", () => {
            console.log("Socket connected:", socket?.id)
        })

        socket.on("disconnect", () => {
            console.log("Socket disconnected")
        })
    }

    return socket
}
