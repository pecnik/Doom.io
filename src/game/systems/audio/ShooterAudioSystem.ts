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
            if (entity.shooter.sound === WeaponState.Shoot) {
                entity.shooter.sound = WeaponState.Idle;
                Sound2D.get(getWeaponSpec(entity).fireSoundSrc).play();
            }

            if (entity.shooter.sound === WeaponState.Reload) {
                entity.shooter.sound = WeaponState.Idle;
                Sound2D.get("/assets/sounds/reload.wav").play();
            }
        });
    }
}
