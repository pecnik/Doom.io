import { System } from "../ecs";
import { getWeaponAmmo, getWeaponSpec } from "../Helpers";
import { Sound2D } from "../sound/Sound2D";
import { sample } from "lodash";
import { EntityFactory } from "../data/EntityFactory";
import { PickupArchetype, LocalAvatarArchetype } from "../ecs/Archetypes";
import { WeaponType } from "../data/Weapon";

export class PickupSystem extends System {
    private readonly pickupFamily = this.createEntityFamily({
        archetype: new PickupArchetype(),
    });

    private readonly playerFamily = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public update() {
        // Spawn pickup items ...
        if (this.pickupFamily.entities.size < 4) {
            this.spawnPickup();
        }

        // Pickup items ...
        this.playerFamily.entities.forEach((player) => {
            this.pickupFamily.entities.forEach((pickup) => {
                const ammo = getWeaponAmmo(player, pickup.pickup.weaponType);
                const spec = getWeaponSpec(player, pickup.pickup.weaponType);

                if (ammo.reserved >= spec.maxReservedAmmo) {
                    return;
                }

                const p1 = player.position;
                const p2 = pickup.position;
                const dist = p1.distanceToSquared(p2);
                if (dist < 0.5 ** 2) {
                    this.world.removeEntity(pickup.id);
                    ammo.reserved += 10;
                    ammo.reserved = Math.min(
                        ammo.reserved,
                        spec.maxReservedAmmo
                    );

                    Sound2D.get("/assets/sounds/pickup_1.wav").play();
                }
            });
        });
    }

    private spawnPickup() {
        const spawn = sample(this.world.level.getSpawnPoints());
        if (spawn === undefined) return;

        for (const [, pickup] of this.pickupFamily.entities) {
            const dist = pickup.position.distanceToSquared(spawn);
            if (dist < 4) return;
        }

        for (const [, pickup] of this.playerFamily.entities) {
            const dist = pickup.position.distanceToSquared(spawn);
            if (dist < 4) return;
        }

        const weaponType = sample([
            WeaponType.Pistol,
            WeaponType.Shotgun,
            WeaponType.Machinegun,
        ]);

        if (weaponType !== undefined) {
            const pickup = EntityFactory.AmmoPikcup(weaponType);
            pickup.position.copy(spawn);
            pickup.position.y -= 0.5;
            pickup.rotation.y = Math.random() * Math.PI;
            this.world.addEntity(pickup);
        }
    }
}
