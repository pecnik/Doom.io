import { System } from "../ecs";
import { PositionalAudio, AudioLoader } from "three";
import { random } from "lodash";
import { World } from "../ecs";
import { Comp } from "../ecs";

export class AudioFootstepSystem extends System {
    private buffer?: AudioBuffer;

    private readonly group = this.createSceneGroup();
    private readonly family = this.createEntityFamily({
        archetype: {
            footstep: new Comp.Footstep(),
            position: new Comp.Position(),
            velocity: new Comp.Velocity(),
            collision: new Comp.Collision(),
        },
        onEntityRemvoed: ({ footstep }) => {
            if (footstep.audio !== undefined) {
                this.group.remove(footstep.audio);
            }
        },
    });

    public constructor(world: World) {
        super(world);
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
