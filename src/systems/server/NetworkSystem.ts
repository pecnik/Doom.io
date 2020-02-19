import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../../World";
import {
    PositionComponent,
    VelocityComponent,
    RotationComponent
} from "../../Components";
import {
    SpawnPlayerAvatarAction,
    DespwnPlayerAvatarAction
} from "../../Actions";

export class NetworkSystem extends System {
    private readonly io: SocketIO.Server;
    private readonly avatars: Family;

    public constructor(world: World, socket: SocketIO.Server) {
        super();
        this.io = socket;
        this.avatars = new FamilyBuilder(world)
            .include(PositionComponent)
            .include(VelocityComponent)
            .include(RotationComponent)
            .build();
    }

    public onAttach(world: World) {
        this.io.on("connect", socket => {
            // Firs spawn current players
            this.avatars.entities.forEach(avatar => {
                const spawnPeer = new SpawnPlayerAvatarAction(
                    avatar.id as string,
                    avatar.getComponent(PositionComponent)
                );
                socket.emit("dispatch", spawnPeer);
            });

            // Spawn new player
            const spawnAvatar = new SpawnPlayerAvatarAction(socket.id, {
                x: 0,
                y: 0,
                z: 0
            });

            world.dispatch(spawnAvatar);

            this.avatars.entities.forEach(avatar => {
                const avatarSocket = this.io.sockets.connected[avatar.id];
                if (avatarSocket !== undefined) {
                    avatarSocket.emit("dispatch", spawnAvatar);
                }
            });

            socket.on("disconnect", () => {
                const despawnAvatar = new DespwnPlayerAvatarAction(socket.id);

                world.dispatch(despawnAvatar);

                this.avatars.entities.forEach(avatar => {
                    const avatarSocket = this.io.sockets.connected[avatar.id];
                    if (avatarSocket !== undefined) {
                        avatarSocket.emit("dispatch", despawnAvatar);
                    }
                });
            });
        });
    }

    public update() {
        // ...
    }
}
