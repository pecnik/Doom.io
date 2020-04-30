import { System, AnyComponents } from "../ecs";
import { World } from "../ecs";
import { Components } from "../ecs";
import { lerp } from "../core/Utils";
import { PLAYER_HEIGHT, PLAYER_CROUCH_H } from "../data/Globals";
import { VoxelType } from "../data/Level";

class Archetype implements AnyComponents {
    public input = new Components.Input();
    public position = new Components.Position();
    public collision = new Components.Collision();
}

export class PlayerCouchSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new Archetype(),
    });

    public update(world: World) {
        this.family.entities.forEach((entity) => {
            const input = entity.input;
            const position = entity.position;
            const collisio = entity.collision;

            if (input.crouch && collisio.height > PLAYER_CROUCH_H) {
                collisio.height = lerp(collisio.height, PLAYER_CROUCH_H, 0.1);
                return;
            }

            if (!input.crouch && collisio.height < PLAYER_HEIGHT) {
                const voxelType = world.level.getVoxelType(
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
