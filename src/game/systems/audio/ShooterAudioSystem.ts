import { System } from "../../ecs";
import { WeaponState } from "../../data/Types";
import { getWeaponSpec } from "../../Helpers";
import { LocalAvatarArchetype } from "../../ecs/Archetypes";
import { Sound2D } from "../../sound/Sound2D";
import { WEAPON_SPEC_RECORD } from "../../data/Weapon";
import { Netcode } from "../../Netcode";

export class ShooterAudioSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public update() {
        this.family.entities.forEach((entity) => {
            if (entity.shooter.sound === WeaponState.Shoot) {
                entity.shooter.sound = WeaponState.Idle;

                const src = getWeaponSpec(entity).fireSound;
                const emitSound = new Netcode.EmitSound(entity.id, src);
                entity.eventsBuffer.push(emitSound);
            }

            if (entity.shooter.sound === WeaponState.Reload) {
                entity.shooter.sound = WeaponState.Idle;

                const src = getWeaponSpec(entity).reloadSound;
                const emitSound = new Netcode.EmitSound(entity.id, src);
                entity.eventsBuffer.push(emitSound);
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
