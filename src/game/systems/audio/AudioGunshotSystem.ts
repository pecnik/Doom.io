import { System } from "../../ecs";
import { PositionalAudio } from "three";
import { Components } from "../../ecs";
import { getHeadPosition } from "../../Helpers";
import { WeaponSpecs } from "../../data/Types";

export class AudioGunshotSystem extends System {
    private readonly group = this.createSceneGroup();
    private readonly family = this.createEntityFamily({
        archetype: {
            gunshot: new Components.Gunshot(),
            shooter: new Components.Shooter(),
            position: new Components.Position(),
            rotation: new Components.Rotation(),
            collision: new Components.Collision(),
        },
        onEntityRemvoed: ({ gunshot }) => {
            if (gunshot.audio !== undefined) {
                this.group.remove(gunshot.audio);
            }
        },
    });

    public update() {
        this.family.entities.forEach((entity) => {
            if (this.world.listener === undefined) {
                return;
            }

            const position = getHeadPosition(entity);
            const rotation = entity.rotation;
            const shooter = entity.shooter;
            const gunshot = entity.gunshot;

            const weapon = WeaponSpecs[shooter.weaponIndex];
            if (weapon === undefined) return;
            if (weapon.fireSoundBuffer === undefined) return;

            if (gunshot.audio === undefined) {
                gunshot.audio = new PositionalAudio(this.world.listener);
                gunshot.audio.position.z = -0.25;
                gunshot.origin.add(gunshot.audio);
                this.group.add(gunshot.origin);
            }

            if (shooter.shootTime === this.world.elapsedTime) {
                if (gunshot.audio.buffer !== weapon.fireSoundBuffer) {
                    gunshot.audio.setBuffer(weapon.fireSoundBuffer);
                }

                if (gunshot.audio.isPlaying) {
                    gunshot.audio.stop();
                }

                gunshot.audio.play(0);
            }

            gunshot.origin.rotation.set(rotation.x, rotation.y, 0, "YXZ");
            gunshot.origin.position.copy(position);
        });
    }
}
