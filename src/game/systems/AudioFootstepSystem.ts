import { System, Family, FamilyBuilder, Entity } from "../core/ecs";
import { Group, PositionalAudio, AudioLoader } from "three";
import { random } from "lodash";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { onFamilyChange } from "../utils/Helpers";

export class AudioFootstepSystem extends System {
    private readonly family: Family;
    private readonly group: Group;
    private buffer?: AudioBuffer;

    public constructor(world: World) {
        super();

        this.family = new FamilyBuilder(world)
            .include(Comp.Footstep)
            .include(Comp.Position)
            .include(Comp.Velocity)
            .include(Comp.Collision)
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

        new AudioLoader().load("/assets/sounds/footstep.wav", buffer => {
            this.buffer = buffer;
        });
    }

    public update(world: World) {
        if (world.listener === undefined) {
            return;
        }

        if (this.buffer === undefined) {
            return;
        }

        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const position = entity.getComponent(Comp.Position);
            const velocity = entity.getComponent(Comp.Velocity);
            const footstep = entity.getComponent(Comp.Footstep);
            const collision = entity.getComponent(Comp.Collision);

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
        }
    }
}
