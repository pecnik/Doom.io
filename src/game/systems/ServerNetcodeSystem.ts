import SocketIO from "socket.io";
import { World, System, Comp } from "../ecs";
import { Netcode } from "../data/Netcode";
import { sample } from "lodash";

export class ServerNetcodeSystem extends System {
    private readonly io: SocketIO.Server;
    private readonly players = this.createEntityFamily({
        archetype: {
            playerTag: true,
            position: new Comp.Position(),
        },
    });

    public constructor(world: World, io: SocketIO.Server) {
        super(world);

        this.io = io;
        this.io.on("connect", (socket) => {
            console.log(`> Connection::${socket.id}`);

            const spawnTimeout = setTimeout(() => {
                this.spawnClient(socket);
            }, 500);

            socket.on("dispatch", (ev: Netcode.Event) => {
                this.onClientDispatch(socket, ev);
            });

            socket.on("disconnect", () => {
                const killEntity = new Netcode.KillEntityEvent(socket);
                this.dispatch(killEntity, this.io);
                clearTimeout(spawnTimeout);
                console.log(`> Disconnect::${socket.id}`);
            });
        });
    }

    public update() {}

    private dispatch(event: Netcode.Event, ctx: Netcode.Ctx) {
        Netcode.dispatch(this.engine, event);
        ctx.emit("dispatch", event);
    }

    private spawnClient(socket: SocketIO.Socket) {
        const spawn = sample(this.engine.level.spawnPoints);
        if (spawn === undefined) return;

        const playerId = socket.id;

        // Spawn player-entity in client world
        const spawnPlayer = new Netcode.PlayerSpawnEvent();
        spawnPlayer.id = playerId;
        spawnPlayer.x = spawn.x;
        spawnPlayer.y = spawn.y;
        spawnPlayer.z = spawn.z;
        this.dispatch(spawnPlayer, socket);

        // Spawn enemy-entity in other client worlds
        const spawnEnemy = new Netcode.EnemySpawnEvent();
        spawnEnemy.id = playerId;
        spawnEnemy.x = spawn.x;
        spawnEnemy.y = spawn.y;
        spawnEnemy.z = spawn.z;
        this.dispatch(spawnEnemy, socket.broadcast);

        // Spawn enemy-entity in client world
        this.players.entities.forEach((player) => {
            if (player.id !== socket.id) {
                const spawnEnemy = new Netcode.EnemySpawnEvent();
                spawnEnemy.id = player.id;
                spawnEnemy.x = player.position.x;
                spawnEnemy.y = player.position.y;
                spawnEnemy.z = player.position.z;
                socket.emit("dispatch", spawnEnemy);
            }
        });
    }

    private onClientDispatch(socket: SocketIO.Socket, ev: Netcode.Event) {
        switch (ev.type) {
            case Netcode.EventType.HitEntity: {
                const target = this.engine.entities.get(ev.targetId);
                if (target === undefined) return;
                if (target.health === undefined) return;

                target.health.value -= ev.damage;
                target.health.value = Math.max(0, target.health.value);

                if (target.health.value === 0) {
                    const killEntity = new Netcode.KillEntityEvent(target);
                    this.dispatch(killEntity, this.io);
                } else {
                    const syncEntity = new Netcode.SyncPlayerStatsEvent(target);
                    this.dispatch(syncEntity, this.io);
                }

                break;
            }

            default: {
                this.dispatch(ev, socket.broadcast);
                break;
            }
        }
    }
}
