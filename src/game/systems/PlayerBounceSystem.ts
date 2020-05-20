import { System } from "../ecs";
import { JUMP_SPEED } from "../data/Globals";
import { LocalAvatarArchetype } from "../ecs/Archetypes";
import { Netcode } from "../Netcode";

export class PlayerBounceSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public update() {
        this.family.entities.forEach((entity) => {
            const { position, velocity, collision } = entity;
            if (collision.falg.y === -1 && velocity.y <= 0) {
                const voxel = this.world.level.getVoxelAt(position);
                if (voxel !== undefined && voxel.bounce > 0) {
                    velocity.y = JUMP_SPEED * Math.sqrt(voxel.bounce);
                    velocity.x *= 0.25;
                    velocity.z *= 0.25;

                    const src = "/assets/sounds/bounce.wav";
                    const emitSound = new Netcode.EmitSound(entity.id, src);
                    entity.eventsBuffer.push(emitSound);
                }
            }
        });
    }
}
