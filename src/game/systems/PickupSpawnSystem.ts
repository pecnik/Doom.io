import { System } from "../ecs";
import { AvatarArchetype, PickupArchetype } from "../ecs/Archetypes";
import { sample, uniqueId, random } from "lodash";
import { WeaponType } from "../data/Weapon";
import { Action } from "../Action";
import { Vector3 } from "three";
import { MAX_PICKUP_COUNT } from "../data/Globals";

export class PickupSpawnSystem extends System {
    private readonly pickups = this.createEntityFamily({
        archetype: new PickupArchetype(),
    });

    private readonly avatars = this.createEntityFamily({
        archetype: new AvatarArchetype(),
    });

    private readonly getRandomWeaponType = (() => {
        const types = [
            WeaponType.Pistol,
            WeaponType.Shotgun,
            WeaponType.Machinegun,
            WeaponType.Plasma,
        ];
        return () => sample(types) as WeaponType;
    })();

    public readonly updateInterval = 3; // every 3 sec
    public update() {
        if (this.pickups.entities.size >= MAX_PICKUP_COUNT) return;

        const spawnPoint = sample(this.world.level.getSpawnPoints());
        if (spawnPoint === undefined) return;

        for (const [, avatar] of this.avatars.entities) {
            const dist = avatar.position.distanceToSquared(spawnPoint);
            if (dist < 6) return;
        }

        for (const [, pickup] of this.pickups.entities) {
            const dist = pickup.position.distanceToSquared(spawnPoint);
            if (dist < 1) return;
        }

        const id = uniqueId("pickup");
        const position = new Vector3();
        position.copy(spawnPoint);
        position.x += random(-0.4, 0.4, true);
        position.x += random(-0.4, 0.4, true);
        position.y -= 0.5;

        if (Math.random() < 0.25) {
            this.game.dispatch(Action.spawnHealthPack(id, position));
        } else {
            const weaponType = this.getRandomWeaponType();
            this.game.dispatch(Action.spawnAmmoPack(id, position, weaponType));
        }
    }
}
