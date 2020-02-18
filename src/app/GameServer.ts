import SocketIO from "socket.io";
import { uniqueId } from "lodash";

export class GameServer {
    private readonly io: SocketIO.Server;

    public constructor(io: SocketIO.Server) {
        (io.engine as any).generateId = () => uniqueId("p");
        this.io = io;
        this.io.on("connect", socket => {
            console.log(`> Connection::${socket.id}`);

            socket.on("disconnect", () => {
                console.log(`> Disconnect::${socket.id}`);
            });
        });
    }
}
