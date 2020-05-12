import { System } from "../../ecs";
import { WeaponState } from "../../data/Types";
import { getWeaponSpec } from "../../Helpers";
import { AvatarArchetype } from "../../ecs/Archetypes";
import { Sound2D } from "../../sound/Sound2D";
import { WEAPON_SPEC_RECORD } from "../../data/Weapon";

export class ShooterAudioSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new AvatarArchetype(),
    });

    public update() {
        this.family.entities.forEach((entity) => {
            if (entity.shooter.sound === WeaponState.Shoot) {
                entity.shooter.sound = WeaponState.Idle;
                Sound2D.get(getWeaponSpec(entity).fireSound).play();
            }

            if (entity.shooter.sound === WeaponState.Reload) {
                entity.shooter.sound = WeaponState.Idle;
                Sound2D.get(getWeaponSpec(entity).reloadSound).play();
            }

            // Stop reload sound effect
            if (entity.shooter.state === WeaponState.Swap) {
                Object.values(WEAPON_SPEC_RECORD).forEach((spec) => {
                    const reloadSound = Sound2D.get(spec.reloadSound);
                    if (
                        reloadSound.audio.duration > 0 &&
                        !reloadSound.audio.paused
                    ) {
                        reloadSound.audio.currentTime = 0;
                        reloadSound.audio.pause();
                    }
                });
            }
        });
    }
}
