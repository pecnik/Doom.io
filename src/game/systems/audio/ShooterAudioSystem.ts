import { System } from "../../ecs";
import { WeaponState } from "../../data/Types";
import { getWeaponSpec } from "../../Helpers";
import { AvatarArchetype } from "../../ecs/Archetypes";
import { Sound2D } from "../../sound/Sound2D";

export class ShooterAudioSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new AvatarArchetype(),
    });

    public update() {
        this.family.entities.forEach((entity) => {
            if (entity.shooter.state === WeaponState.Shoot) {
                const weaponSpec = getWeaponSpec(entity);
                Sound2D.get(weaponSpec.fireSoundSrc).play();

                // const sound3D = Sound3D.get(weaponSpec.fireSoundSrc);
                // sound3D.emitFrom(entity);
            }
        });
    }
}
