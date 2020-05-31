import { World } from "../ecs";
import { Sound2D } from "../sound/Sound2D";
import { Sound3D } from "../sound/Sound3D";
import { AvatarFrameSync } from "./Netcode";

export class ClientDispatcher {
    protected readonly world: World;

    public constructor(world: World) {
        this.world = world;
    }

    public playSound(entityId: string, sound: string) {
        const entity = this.world.entities.get(entityId);
        if (entity === undefined) return;
        if (entity.position === undefined) return;

        if (entity.localAvatarTag === true) {
            Sound2D.get(sound).play();
        } else {
            Sound3D.get(sound).emitFrom(entity);
        }
    }

    public avatarFrameSync(_sync: AvatarFrameSync) {
        // Ignore
    }

    public hitEnemyPlayer() {}

    public killEnemyPlayer() {}
}
