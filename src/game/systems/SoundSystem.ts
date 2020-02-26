import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { memoize } from "lodash";
import { World } from "../World";
import { SoundComponent, Object3DComponent } from "../Components";
import { AudioListener, AudioLoader, PositionalAudio } from "three";

export class SoundSystem extends System {
    private readonly family: Family;
    private readonly listener: AudioListener;
    private readonly getAudioBuffer = memoize((src: string) => {
        const audio: { buffer?: AudioBuffer } = {};
        new AudioLoader().load(src, buffer => {
            audio.buffer = buffer;
        });
        return audio;
    });

    public constructor(world: World) {
        super();

        this.listener = new AudioListener();
        world.camera.add(this.listener);

        this.family = new FamilyBuilder(world)
            .include(Object3DComponent)
            .include(SoundComponent)
            .build();

        world.addEntityListener({
            onEntityAdded: entity => {
                if (!entity.hasComponent(Object3DComponent)) return;
                if (!entity.hasComponent(SoundComponent)) return;
                const object = entity.getComponent(Object3DComponent);
                const sound = entity.getComponent(SoundComponent);
                for (let i = 0; i < 3; i++) {
                    const channel = new PositionalAudio(this.listener);
                    channel.position.z = -1;
                    sound.channels.push(channel);
                    object.add(channel);
                }
            },
            onEntityRemoved(entity) {
                if (!entity.hasComponent(Object3DComponent)) return;
                if (!entity.hasComponent(SoundComponent)) return;
                const object = entity.getComponent(Object3DComponent);
                const sound = entity.getComponent(SoundComponent);
                if (sound.channels !== undefined) {
                    object.remove(...sound.channels);
                }
            }
        });
    }

    public update() {
        if (!(document as any).pointerLockElement) {
            return;
        }

        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const sound = entity.getComponent(SoundComponent);
            if (!sound.play) continue;

            const audio = this.getAudioBuffer(sound.src);
            if (audio.buffer === undefined) continue;

            for (let i = 0; i < sound.channels.length; i++) {
                const channel = sound.channels[i];

                let isFree = false;
                if (channel.isPlaying === false) isFree = true;
                if (channel.buffer === null) isFree = true;
                if (channel.buffer === audio.buffer) isFree = true;
                if (!isFree) {
                    continue;
                }

                if (channel.isPlaying) {
                    channel.stop();
                }

                channel.setBuffer(audio.buffer);
                channel.setVolume(1);
                channel.setRefDistance(8);
                channel.setRolloffFactor(8);
                channel.play(0);
                break;
            }

            sound.play = false;
        }
    }
}
