import { System } from "../../ecs";
import { WeaponState } from "../../data/Types";
import { getWeaponSpec } from "../../Helpers";
import { LocalAvatarArchetype } from "../../ecs/Archetypes";
import { Sound2D } from "../../sound/Sound2D";
import { WEAPON_SPEC_RECORD } from "../../data/Weapon";
import { GameClient } from "../../GameClient";

export class ShooterAudioSystem extends System {
    private readonly client: GameClient;
    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public constructor(client: GameClient) {
        super(client.world);
        this.client = client;
    }

    public update() {
        this.family.entities.forEach((entity) => {
            if (entity.shooter.sound === WeaponState.Shoot) {
                entity.shooter.sound = WeaponState.Idle;
                this.client.playSound(
                    entity.id,
                    getWeaponSpec(entity).fireSound
                );
            }

            if (entity.shooter.sound === WeaponState.Reload) {
                entity.shooter.sound = WeaponState.Idle;
                this.client.playSound(
                    entity.id,
                    getWeaponSpec(entity).reloadSound
                );
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
