import { System } from "../ecs";
import { GameContext } from "../GameContext";
import { PickupArchetype, AvatarArchetype } from "../ecs/Archetypes";
import { getWeaponAmmo, getWeaponSpec } from "../Helpers";

export class ItemPickupSystem extends System {
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
        // Pickup items ...
        this.avatars.entities.forEach((avatar) => {
            this.pickups.entities.forEach((pickup) => {
                const ammo = getWeaponAmmo(avatar, pickup.pickup.weaponType);
                const spec = getWeaponSpec(avatar, pickup.pickup.weaponType);
                if (ammo.reserved >= spec.maxReservedAmmo) {
                    return;
                }

                const p1 = avatar.position;
                const p2 = pickup.position;
                const dist = p1.distanceToSquared(p2);
                if (dist < 0.5 ** 2) {
                    this.game.pickupAmmoPack(avatar.id, pickup.id);
                }
            });
        });
    }
}
