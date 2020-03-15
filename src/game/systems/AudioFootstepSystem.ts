import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { AudioListener, Group, PositionalAudio, AudioLoader } from "three";
import { random } from "lodash";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { onFamilyChange } from "../utils/EntityUtils";

export class AudioFootstepSystem extends System {
    private readonly family: Family;
    private readonly group: Group;
    private listener?: AudioListener;
    private buffer?: AudioBuffer;

    public constructor(world: World) {
        super();

        this.family = new FamilyBuilder(world)
            .include(Comp.Footstep)
            .include(Comp.Position2D)
            .include(Comp.Velocity2D)
            .build();

        this.group = new Group();
        world.scene.add(this.group);

        onFamilyChange(world, this.family, {
            onEntityRemoved: (entity: Entity) => {
                const footstep = entity.getComponent(Comp.Footstep);
                if (footstep.audio !== undefined) {
                    this.group.remove(footstep.audio);
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
            new AudioLoader().load("/assets/sounds/footstep.wav", buffer => {
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
            const velocity = entity.getComponent(Comp.Velocity2D);
            const footstep = entity.getComponent(Comp.Footstep);

            if (footstep.audio === undefined) {
                footstep.audio = new PositionalAudio(this.listener);
                footstep.audio.setBuffer(this.buffer);
                this.group.add(footstep.audio);
            }

            if (
                footstep.audio.isPlaying === false &&
                velocity.lengthSq() > 10
            ) {
                footstep.audio.detune = random(1, 6) * 100;
                footstep.audio.setVolume(random(0.25, 0.5, true));
                footstep.audio.play();
            }

            footstep.audio.position.set(position.x, -0.5, position.y);
        }
    }
}
