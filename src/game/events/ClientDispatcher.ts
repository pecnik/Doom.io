import { World } from "../ecs";
import { Sound2D } from "../sound/Sound2D";
import { Sound3D } from "../sound/Sound3D";
import { LocalAvatarArchetype } from "../ecs/Archetypes";

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

    public frameUpdate(_avatar: LocalAvatarArchetype) {}

    public hitEnemyPlayer() {}

    public killEnemyPlayer() {}
}
