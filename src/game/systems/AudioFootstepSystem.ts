import { System, Family } from "../ecs";
import { Group, PositionalAudio, AudioLoader } from "three";
import { random } from "lodash";
import { World } from "../data/World";
import { Comp } from "../ecs";

export class AudioFootstepSystem extends System {
    private readonly group: Group;
    private buffer?: AudioBuffer;

    private readonly family = new Family(this.engine, {
        footstep: new Comp.Footstep(),
        position: new Comp.Position(),
        velocity: new Comp.Velocity(),
        collision: new Comp.Collision(),
    });

    public constructor(world: World) {
        super(world);

        this.family.onEntityRemvoed.push((entity) => {
            const { footstep } = entity;
            if (footstep.audio !== undefined) {
                this.group.remove(footstep.audio);
            }
        });

        this.group = new Group();
        world.scene.add(this.group);
        new AudioLoader().load("/assets/sounds/footstep.wav", (buffer) => {
            this.buffer = buffer;
        });
    }

    public update(world: World) {
        this.family.entities.forEach((entity) => {
            const { position, velocity, footstep, collision } = entity;

            if (world.listener === undefined) {
                return;
            }

            if (this.buffer === undefined) {
                return;
            }

            if (footstep.audio === undefined) {
                footstep.audio = new PositionalAudio(world.listener);
                footstep.audio.setBuffer(this.buffer);
                this.group.add(footstep.audio);
            }

            if (
                footstep.audio.isPlaying === false &&
                collision.falg.y === -1 &&
                (Math.abs(velocity.x) > 2 || Math.abs(velocity.z) > 2)
            ) {
                footstep.audio.detune = random(1, 6) * 100;
                footstep.audio.setVolume(random(0.25, 0.5, true));
                footstep.audio.play();
            }

            footstep.audio.position.copy(position);
        });
    }
}
