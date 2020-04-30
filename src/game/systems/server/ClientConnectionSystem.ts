import { System, Components } from "../../ecs";
import { GameServer } from "../../GameServer";
import { PlayerArchetype, AvatarArchetype } from "../../ecs/Archetypes";
import { Netcode } from "../../Netcode";
import { getPlayerAvatar } from "../../Helpers";

export class ClientConnectionSystem extends System {
    private readonly server: GameServer;
    private readonly players = this.createEntityFamily({
        archetype: new PlayerArchetype(),
    });

    private readonly avatars = this.createEntityFamily({
        archetype: new AvatarArchetype(),
    });

    public constructor(server: GameServer) {
        super(server.world);
        this.server = server;
        this.server.io.on("connect", (socket) => {
            const timeout = setTimeout(() => {
                // Sync player entities
                this.players.entities.forEach((player) => {
                    const { playerData } = player;
                    const createPlayer = new Netcode.CreatePlayer(playerData);
                    socket.emit("dispatch", createPlayer);

                    const avatar = getPlayerAvatar(player.id, this.avatars);
                    if (avatar !== undefined) {
                        const spawnAvatar = new Netcode.SpawnEnemyAvatar(
                            player,
                            avatar.position
                        );
                        socket.emit("dispatch", spawnAvatar);
                    }
                });

                // Create the new player
                const playerData = new Components.PlayerData();
                playerData.id = socket.id;
                playerData.name = `Player-${socket.id}`;

                const createPlayer = new Netcode.CreatePlayer(playerData);
                this.server.dispatch(createPlayer, this.server.io);

                console.log(`> Connection::${socket.id}`);
            }, 500);

            socket.on("disconnect", () => {
                clearTimeout(timeout);
                const deletePlayer = new Netcode.DeletePlayer(socket.id);
                this.server.dispatch(deletePlayer, this.server.io);
                console.log(`> Disconnect::${socket.id}`);
            });

            socket.on("dispatch", (ev: Netcode.Event) => {
                this.onClientDispatch(socket, ev);
            });
        });
    }

    public update() {
        // ...
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
                    this.server.dispatch(killEntity, this.server.io);
                } else {
                    const syncEntity = new Netcode.SyncAvatarStats(target);
                    this.server.dispatch(syncEntity, this.server.io);
                }

                break;
            }

            default: {
                this.server.dispatch(ev, socket.broadcast);
                break;
            }
        }
    }
}
