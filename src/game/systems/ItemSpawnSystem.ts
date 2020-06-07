import { System } from "../ecs";
import { PickupArchetype, AvatarArchetype } from "../ecs/Archetypes";
import { sample } from "lodash";
import { WeaponType } from "../data/Weapon";
import { GameContext } from "../GameContext";

export class ItemSpawnSystem extends System {
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

    public readonly updateInterval = 3; // every 3 sec
    public update() {
        if (this.pickups.entities.size > 4) return;

        const spawnPoint = sample(this.world.level.getSpawnPoints());
        if (spawnPoint === undefined) return;

        for (const [, avatar] of this.avatars.entities) {
            const dist = avatar.position.distanceToSquared(spawnPoint);
            if (dist < 4) return;
        }

        for (const [, pickup] of this.pickups.entities) {
            const dist = pickup.position.distanceToSquared(spawnPoint);
            if (dist < 4) return;
        }

        const weaponType = sample([
            WeaponType.Pistol,
            WeaponType.Shotgun,
            WeaponType.Machinegun,
            WeaponType.Plasma,
        ]);

        if (weaponType !== undefined) {
            const position = spawnPoint.clone();
            position.y -= 0.5;
            this.game.spawnAmmoPack(position, weaponType);
        }
    }
}
