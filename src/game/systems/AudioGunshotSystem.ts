import { System, Family } from "../ecs";
import { Group, PositionalAudio } from "three";
import { World } from "../data/World";
import { Comp } from "../ecs";
import { getHeadPosition } from "../utils/Helpers";
import { WeaponSpecs } from "../data/Weapon";

export class AudioGunshotSystem extends System {
    private readonly group: Group;
    private readonly family = new Family(this.engine, {
        gunshot: new Comp.Gunshot(),
        shooter: new Comp.Shooter(),
        position: new Comp.Position(),
        rotation: new Comp.Rotation2D(),
        collision: new Comp.Collision(),
    });

    public constructor(world: World) {
        super(world);

        this.group = new Group();
        world.scene.add(this.group);

        this.family.onEntityRemvoed.push((entity) => {
            const { gunshot } = entity;
            if (gunshot.audio !== undefined) {
                this.group.remove(gunshot.audio);
            }
        });
    }

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
