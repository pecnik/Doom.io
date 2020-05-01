import { System } from "../ecs";
import { lerp } from "../core/Utils";
import { PLAYER_HEIGHT, PLAYER_CROUCH_H } from "../data/Globals";
import { VoxelType } from "../data/Level";
import { LocalAvatarArchetype } from "../ecs/Archetypes";

export class PlayerCouchSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public update() {
        this.family.entities.forEach((entity) => {
            const input = entity.input;
            const position = entity.position;
            const collisio = entity.collision;

            if (input.crouch && collisio.height > PLAYER_CROUCH_H) {
                collisio.height = lerp(collisio.height, PLAYER_CROUCH_H, 0.1);
                return;
            }

            if (!input.crouch && collisio.height < PLAYER_HEIGHT) {
                const voxelType = this.world.level.getVoxelType(
                    Math.round(position.x),
                    Math.round(position.y + PLAYER_HEIGHT),
                    Math.round(position.z)
                );

                if (voxelType === VoxelType.Block) {
                    return;
                }

                collisio.height = lerp(collisio.height, PLAYER_HEIGHT, 0.1);
            }
        });
    }
}
