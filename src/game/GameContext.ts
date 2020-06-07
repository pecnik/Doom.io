import { World } from "./ecs";
import { WeaponType } from "./data/Weapon";
import { Vector3 } from "three";

export abstract class GameContext {
    public abstract readonly world: World;

    public spawnAmmoPack(_position: Vector3, _weaponType: WeaponType) {
        // ...
    }
}
