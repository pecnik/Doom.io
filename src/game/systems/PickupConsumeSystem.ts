import { System } from "../ecs";
import { GameContext } from "../GameContext";
import { PickupArchetype, AvatarArchetype } from "../ecs/Archetypes";
import { Action } from "../Action";

export class PickupConsumeSystem extends System {
    private readonly game: GameContext;

    private readonly pickups = this.createEntityFamily({
        archetype: new PickupArchetype(),
    });

    private readonly avatars = this.createEntityFamily({
        archetype: new AvatarArchetype(),
    });

    public constructor(game: GameContext) {
        super(game.world);
        this.game = game;
    }

    public update() {
        this.avatars.entities.forEach((avatar) => {
            this.pickups.entities.forEach((pickup) => {
                const p1 = avatar.position;
                const p2 = pickup.position;
                const dist = p1.distanceToSquared(p2);
                if (dist < 0.5 ** 2) {
                    const consume = Action.consumePickup(avatar.id, pickup.id);
                    this.game.dispatch(consume);
                }
            });
        });
    }
}
