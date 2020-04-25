import { System } from "../ecs";
import { Comp } from "../ecs";
import { getWeaponAmmo, getWeaponSpec } from "../Helpers";
import { sample } from "lodash";
import { EntityFactory } from "../data/EntityFactory";

class PickupArchetype {
    position = new Comp.Position();
    pickup = new Comp.Pickup();
}

class PlayerArchetype {
    input = new Comp.PlayerInput();
    position = new Comp.Position();
    shooter = new Comp.Shooter();
}

export class PickupSystem extends System {
    private readonly pickupFamily = this.createEntityFamily({
        archetype: new PickupArchetype(),
    });

    private readonly playerFamily = this.createEntityFamily({
        archetype: new PlayerArchetype(),
    });

    public update() {
        // Spawn pickup items ...
        if (this.pickupFamily.entities.size < 4) {
            this.spawnPickup();
        }

        // Pickup items ...
        this.playerFamily.entities.forEach((player) => {
            const ammo = getWeaponAmmo(player);
            const spec = getWeaponSpec(player);
            if (ammo.reserved < spec.maxReservedAmmo) {
                this.pickupFamily.entities.forEach((pickup) => {
                    const p1 = player.position;
                    const p2 = pickup.position;
                    const dist = p1.distanceToSquared(p2);
                    if (dist < 1 ** 2) {
                        this.engine.removeEntity(pickup.id);
                        ammo.reserved += 10;
                        ammo.reserved = Math.min(
                            ammo.reserved,
                            spec.maxReservedAmmo
                        );
                    }
                });
            }
        });
    }

    private spawnPickup() {
        const spawn = sample(this.engine.level.spawnPoints);
        if (spawn === undefined) return;

        for (const [, pickup] of this.pickupFamily.entities) {
            const dist = pickup.position.distanceToSquared(spawn);
            if (dist < 2) return;
        }

        const pickup = EntityFactory.Pikcup();
        pickup.position.copy(spawn);
        this.engine.addEntity(pickup);
    }
}
