import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../World";
import {
    SoundComponent,
    PositionComponent,
    FootstepComponent
} from "../Components";
import { Vector2 } from "three";

export class FootstepSystem extends System {
    private readonly family: Family;

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world)
            .include(PositionComponent)
            .include(FootstepComponent)
            .include(SoundComponent)
            .build();

        world.addEntityListener({
            onEntityRemoved: () => {},
            onEntityAdded: entity => {
                if (this.family.includesEntity(entity)) {
                    const position = entity.getComponent(PositionComponent);
                    const footstep = entity.getComponent(FootstepComponent);
                    footstep.prevx = position.x;
                    footstep.prevz = position.z;
                }
            }
        });
    }

    public update() {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const position = entity.getComponent(PositionComponent);
            const footstep = entity.getComponent(FootstepComponent);
            const sound = entity.getComponent(SoundComponent);

            const dx = footstep.prevx - position.x;
            const dz = footstep.prevz - position.z;
            footstep.prevx = position.x;
            footstep.prevz = position.z;

            const delta = new Vector2(dx, dz).length();
            if (delta === 0 && footstep.traveled > 0) {
                footstep.traveled = 0;
                continue;
            }

            footstep.traveled += delta;

            if (footstep.traveled > 1) {
                footstep.traveled = 0;
                sound.play = true;
                sound.src = "/assets/sounds/footstep-1.wav";
            }
        }
    }
}
