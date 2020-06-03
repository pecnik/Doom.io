import { GameClient } from "./GameClient";
import { Family, AnyComponents } from "./ecs";
import {
    AvatarArchetype,
    LocalAvatarArchetype,
    EnemyAvatarArchetype,
    PickupArchetype,
} from "./ecs/Archetypes";
import { snakeCase } from "lodash";

export function createDebugCli(game: GameClient) {
    const command = (name: string, getter: () => any) => {
        const propname = "dd_" + snakeCase(name);
        Object.defineProperty(window, propname, { get: getter });
    };

    const logmap = (map: Map<any, any>) => {
        const data = Array.from(map).map((p) => p[1]);
        console.table(data);
    };

    const archetypeDumps: [string, AnyComponents][] = [
        ["Avatar", new AvatarArchetype()],
        ["LocalAvatar", new LocalAvatarArchetype()],
        ["EnemyAvatar", new EnemyAvatarArchetype()],
        ["Pickup", new PickupArchetype()],
    ];

    archetypeDumps.forEach(([name, archetype]) => {
        const family = Family.findOrCreate(archetype);
        command(name, () => {
            logmap(family.entities);
        });
    });

    command("all", () => logmap(game.world.entities));

    command("world", () => game.world);
}
