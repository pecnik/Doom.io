import { System } from "../ecs";
import { JUMP_SPEED } from "../data/Globals";
import { LocalAvatarArchetype } from "../ecs/Archetypes";
import { GameClient } from "../GameClient";
import { Action } from "../Action";

export class PlayerBounceSystem extends System {
    private readonly game: GameClient;
    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public constructor(client: GameClient) {
        super(client.world);
        this.game = client;
    }

    public update() {
        this.family.entities.forEach((entity) => {
            const { position, velocity, collision } = entity;
            if (collision.falg.y === -1 && velocity.y <= 0) {
                const block = this.world.level.getBlockAt(position);
                if (block !== undefined && block.jumpPadForce > 0) {
                    velocity.y = 0.5 * (JUMP_SPEED * (block.jumpPadForce + 2));
                    velocity.x *= 0.25;
                    velocity.z *= 0.25;

                    const src = "/assets/sounds/bounce.wav";
                    this.game.dispatch(Action.playSound(entity.id, src));
                }
            }
        });
    }
}
