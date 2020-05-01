import { GameClient } from "./GameClient";
import { Family } from "./ecs";
import {
    AvatarArchetype,
    LocalAvatarArchetype,
    EnemyAvatarArchetype,
    PickupArchetype,
    PlayerArchetype,
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

    [
        PlayerArchetype,
        AvatarArchetype,
        LocalAvatarArchetype,
        EnemyAvatarArchetype,
        PickupArchetype,
    ].forEach((Archetype) => {
        const family = Family.findOrCreate(new Archetype());
        command(Archetype.name.replace("Archetype", ""), () => {
            logmap(family.entities);
        });
    });

    command("all", () => logmap(game.world.entities));

    command("world", () => game.world);
}
