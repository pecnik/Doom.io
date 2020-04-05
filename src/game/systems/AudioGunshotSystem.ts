import { System, Family, FamilyBuilder, Entity } from "../core/ecs";
import { Group, PositionalAudio } from "three";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { onFamilyChange } from "../utils/EntityUtils";
import { WeaponSpecs } from "../data/Weapon";

export class AudioGunshotSystem extends System {
    private readonly family: Family;
    private readonly group: Group;

    public constructor(world: World) {
        super();

        this.family = new FamilyBuilder(world)
            .include(Comp.Gunshot)
            .include(Comp.Shooter)
            .include(Comp.Position)
            .include(Comp.Rotation2D)
            .build();

        this.group = new Group();
        world.scene.add(this.group);

        onFamilyChange(world, this.family, {
            onEntityRemoved: (entity: Entity) => {
                const gunshot = entity.getComponent(Comp.Gunshot);
                if (gunshot.audio !== undefined) {
                    this.group.remove(gunshot.audio);
                }
            },
        });
    }

    public update(world: World) {
        if (world.listener === undefined) {
            return;
        }

        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const position = entity.getComponent(Comp.Position);
            const rotation = entity.getComponent(Comp.Rotation2D);
            const shooter = entity.getComponent(Comp.Shooter);
            const gunshot = entity.getComponent(Comp.Gunshot);

            const weapon = WeaponSpecs[shooter.weaponIndex];
            if (weapon === undefined) continue;
            if (weapon.fireSoundBuffer === undefined) continue;

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
        }
    }
}
