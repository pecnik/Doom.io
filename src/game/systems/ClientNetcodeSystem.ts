import SocketIOClient from "socket.io-client";
import { World, System } from "../ecs";
import { Netcode } from "../Netcode";
import { LocalAvatarArchetype } from "../ecs/Archetypes";
import { isEqual } from "lodash";
import { Sound2D } from "../sound/Sound2D";
import { Sound3D } from "../sound/Sound3D";

export class ClientNetcodeSystem extends System {
    private readonly socket: SocketIOClient.Socket;
    private readonly syncEvent = new Netcode.SyncAvatar();
    private readonly prevSyncEvent = new Netcode.SyncAvatar();

    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public constructor(world: World, connect: boolean) {
        super(world);

        const url = location.origin.replace(location.port, "8080");
        this.socket = SocketIOClient.connect(url, {
            reconnection: false,
            autoConnect: false,
        });

        if (connect) {
            this.socket.connect();
        }

        this.socket.on("connect", () => {
            console.log(`> Connection::${this.socket.id}`);
        });

        this.socket.on("dispatch", (ev: Netcode.Event) => {
            this.dispatch(ev);
        });
    }

    public update(): void {
        this.family.entities.forEach((player) => {
            // Sync state
            if (this.socket.connected) {
                this.syncEvent.id = player.id;
                this.syncEvent.wt = player.shooter.weaponType;
                this.syncEvent.px = player.position.x;
                this.syncEvent.py = player.position.y;
                this.syncEvent.pz = player.position.z;
                this.syncEvent.vx = player.velocity.x;
                this.syncEvent.vy = player.velocity.y;
                this.syncEvent.vz = player.velocity.z;
                this.syncEvent.rx = player.rotation.x;
                this.syncEvent.ry = player.rotation.y;
                if (!isEqual(this.syncEvent, this.prevSyncEvent)) {
                    this.socket.emit("dispatch", this.syncEvent);
                    Object.assign(this.prevSyncEvent, this.syncEvent);
                }
            }

            // Dump event buffer
            player.eventsBuffer.forEach((ev) => {
                this.socket.emit("dispatch", ev);
                this.dispatch(ev);
            });
            player.eventsBuffer.length = 0;
        });
    }

    private dispatch(ev: Netcode.Event) {
        switch (ev.type) {
            case Netcode.EventType.EmitSound: {
                const { id, sound } = ev;
                const entity = this.world.entities.get(id);
                if (entity === undefined) return;
                if (entity.position === undefined) return;

                if (entity.localAvatarTag === true) {
                    Sound2D.get(sound).play();
                } else {
                    Sound3D.get(sound).emitFrom(entity);
                }

                return;
            }
            default: {
                Netcode.dispatch(this.world, ev);
            }
        }
    }
}
