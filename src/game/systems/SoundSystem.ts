import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { memoize } from "lodash";
import { World } from "../World";
import { SoundComponent, Object3DComponent } from "../Components";
import { AudioListener, AudioLoader, PositionalAudio, Object3D } from "three";

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
                sound.audio = new PositionalAudio(this.listener);
                object.add(sound.audio);
            },
            onEntityRemoved(entity) {
                if (!entity.hasComponent(Object3DComponent)) return;
                if (!entity.hasComponent(SoundComponent)) return;
                const object = entity.getComponent(Object3DComponent);
                const sound = entity.getComponent(SoundComponent);
                if (sound.audio !== undefined) {
                    object.remove(sound.audio);
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
            if (!sound.audio) continue;

            const audio = this.getAudioBuffer(sound.src);
            if (audio.buffer === undefined) continue;

            sound.audio.setBuffer(audio.buffer);
            sound.audio.setVolume(1);
            sound.audio.setRefDistance(8);
            sound.audio.setRolloffFactor(8);

            if (sound.audio.isPlaying) {
                sound.audio.stop();
            }

            sound.audio.play(0);

            sound.play = false;
        }
    }
}
