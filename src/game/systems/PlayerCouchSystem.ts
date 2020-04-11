import { System, Family, FamilyBuilder } from "../core/ecs";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { lerp } from "../core/Utils";
import { PLAYER_HEIGHT, PLAYER_CROUCH_H } from "../data/Globals";
import { VoxelType } from "../data/Level";

export class PlayerCouchSystem extends System {
    private readonly family: Family;

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world)
            .include(Comp.PlayerInput)
            .include(Comp.Collision)
            .build();
    }

    public update(world: World) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const input = entity.getComponent(Comp.PlayerInput);
            const position = entity.getComponent(Comp.Position);
            const collisio = entity.getComponent(Comp.Collision);

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

                if (voxelType === VoxelType.Solid) {
                    return;
                }

                collisio.height = lerp(collisio.height, PLAYER_HEIGHT, 0.1);
            }
        }
    }
}
