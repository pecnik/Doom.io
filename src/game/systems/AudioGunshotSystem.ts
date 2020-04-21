import { System } from "../ecs";
import { PositionalAudio } from "three";
import { World } from "../ecs";
import { Comp } from "../ecs";
import { getHeadPosition } from "../utils/Helpers";
import { WeaponSpecs } from "../data/Weapon";

export class AudioGunshotSystem extends System {
    private readonly group = this.createSceneGroup();
    private readonly family = this.createEntityFamily({
        archetype: {
            gunshot: new Comp.Gunshot(),
            shooter: new Comp.Shooter(),
            position: new Comp.Position(),
            rotation: new Comp.Rotation2D(),
            collision: new Comp.Collision(),
        },
        onEntityRemvoed: ({ gunshot }) => {
            if (gunshot.audio !== undefined) {
                this.group.remove(gunshot.audio);
            }
        },
    });

    public update(world: World) {
        this.family.entities.forEach((entity) => {
            if (world.listener === undefined) {
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
                gunshot.audio = new PositionalAudio(world.listener);
                gunshot.audio.position.z = -0.25;
                gunshot.origin.add(gunshot.audio);
                this.group.add(gunshot.origin);
            }

            if (shooter.shootTime === world.elapsedTime) {
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
