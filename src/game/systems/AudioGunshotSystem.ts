import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { AudioListener, Group, PositionalAudio, AudioLoader } from "three";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { onFamilyChange } from "../utils/EntityUtils";

export class AudioGunshotSystem extends System {
    private readonly family: Family;
    private readonly group: Group;
    private listener?: AudioListener;
    private buffer?: AudioBuffer;

    public constructor(world: World) {
        super();

        this.family = new FamilyBuilder(world)
            .include(Comp.Gunshot)
            .include(Comp.Shooter)
            .include(Comp.Position2D)
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
            }
        });
    }

    public update(world: World) {
        if (!(document as any).pointerLockElement) {
            return;
        }

        // Await user interaction before initializing audio context
        if (this.listener === undefined) {
            this.listener = new AudioListener();
            world.camera.add(this.listener);
            new AudioLoader().load("/assets/sounds/fire.wav", buffer => {
                this.buffer = buffer;
            });
            return;
        }

        if (this.buffer === undefined) {
            return;
        }

        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const position = entity.getComponent(Comp.Position2D);
            const rotation = entity.getComponent(Comp.Rotation2D);
            const shooter = entity.getComponent(Comp.Shooter);
            const gunshot = entity.getComponent(Comp.Gunshot);

            if (gunshot.audio === undefined) {
                gunshot.audio = new PositionalAudio(this.listener);
                gunshot.audio.setBuffer(this.buffer);
                gunshot.audio.position.z = -0.25;
                gunshot.origin.add(gunshot.audio);
                this.group.add(gunshot.origin);
            }

            if (shooter.shootTime === world.elapsedTime) {
                if (gunshot.audio.isPlaying) {
                    gunshot.audio.stop();
                }

                gunshot.audio.play(0);
            }

            gunshot.origin.rotation.set(rotation.x, rotation.y, 0, "YXZ");
            gunshot.origin.position.set(position.x, 0, position.y);
        }
    }
}