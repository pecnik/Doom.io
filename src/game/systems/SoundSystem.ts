import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { memoize } from "lodash";
import { World } from "../World";
import { SoundComponent, PositionComponent } from "../Components";
import { AudioListener, AudioLoader, PositionalAudio, Object3D } from "three";

export class SoundEmitter extends Object3D {
    public readonly audio: PositionalAudio;
    public readonly src: string;
    public loaded = false;
    public constructor(src: string, listener: AudioListener) {
        super();
        this.src = src;
        this.audio = new PositionalAudio(listener);
        this.add(this.audio);
    }
}

export class SoundSystem extends System {
    private readonly family: Family;
    private readonly listener: AudioListener;

    private readonly getEmitter = memoize((src: string, world: World) => {
        const emitter = new SoundEmitter(src, this.listener);
        world.scene.add(emitter);

        new AudioLoader().load(src, buffer => {
            emitter.loaded = true;
            emitter.audio.setBuffer(buffer);
            emitter.audio.setVolume(1);
            emitter.audio.setRefDistance(8);
            emitter.audio.setRolloffFactor(16);
        });

        return emitter;
    });

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world).include(SoundComponent).build();
        this.listener = new AudioListener();
        world.camera.add(this.listener);
    }

    public update(world: World) {
        if (!(document as any).pointerLockElement) {
            return;
        }

        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const sound = entity.getComponent(SoundComponent);
            if (!sound.play) continue;

            const psoition = entity.getComponent(PositionComponent);
            const emitter = this.getEmitter(sound.src, world);
            if (emitter.loaded) {
                if (emitter.audio.isPlaying) {
                    emitter.audio.stop();
                }

                emitter.position.set(psoition.x, psoition.y, psoition.z);
                emitter.audio.play(0);
            }

            sound.play = false;
        }
    }
}
