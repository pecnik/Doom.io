import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { uniqueId } from "lodash";
import { World } from "../World";
import { SoundEmitterComponent } from "../Components";
import { AudioListener, AudioLoader, PositionalAudio } from "three";

export class SoundSystem extends System {
    private readonly family: Family;

    public constructor(world: World) {
        super();

        this.family = new FamilyBuilder(world)
            .include(SoundEmitterComponent)
            .build();
    }

    public onAttach(world: World) {
        console.log(`> SoundSystem::init`);

        const listener = new AudioListener();
        world.camera.add(listener);

        const audioLoader = new AudioLoader();
        audioLoader.load("/assets/sounds/fire.wav", buffer => {
            const entity = new Entity();
            entity.id = uniqueId("sound");
            world.addEntity(entity);

            const emitter = entity.putComponent(SoundEmitterComponent);
            emitter.audio = new PositionalAudio(listener);
            emitter.audio.setBuffer(buffer);
            emitter.audio.setVolume(0.1);
            emitter.audio.setRefDistance(4);
        });
    }

    public update() {
        if (!(document as any).pointerLockElement) {
            return;
        }

        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const sound = entity.getComponent(SoundEmitterComponent);
            if (sound.audio === undefined) continue;
            if (!sound.audio.isPlaying) {
                sound.audio.play();
            }
        }
    }
}
