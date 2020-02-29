import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../World";
import { ParticleEmitterComponent, PositionComponent } from "../Components";

export class ParticleSystem extends System {
    private readonly family: Family;

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world)
            .include(ParticleEmitterComponent)
            .include(PositionComponent)
            .build();
    }

    public update(world: World) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const emitter = entity.getComponent(ParticleEmitterComponent);

            if (emitter.count >= emitter.times) {
                continue;
            }

            if (world.elapsedTime - emitter.emitTime > emitter.interval) {
                emitter.emitTime = world.elapsedTime;
                emitter.count++;
                console.log("Emit");
            }
        }
    }
}
