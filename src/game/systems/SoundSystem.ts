import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { memoize } from "lodash";
import { World } from "../World";
import { SoundComponent, PositionComponent } from "../Components";
import {
    AudioListener,
    AudioLoader,
    PositionalAudio,
    Object3D,
    Mesh,
    MeshBasicMaterial,
    BoxGeometry
} from "three";

export class SoundSystem extends System {
    private readonly family: Family;
    private readonly listener: AudioListener;

    private readonly getAudio = memoize((src: string, world: World) => {
        const audioLoader = new AudioLoader();
        const audio = {
            loaded: false,
            audio: new PositionalAudio(this.listener),
            object: new Object3D()
        };

        audio.object.add(audio.audio);
        audio.object.add(
            new Mesh(
                new BoxGeometry(1, 1, 1),
                new MeshBasicMaterial({ color: 0xffffff, wireframe: true })
            )
        );

        world.scene.add(audio.object);

        audioLoader.load(src, buffer => {
            audio.loaded = true;
            audio.audio.setBuffer(buffer);
            audio.audio.setVolume(0.25);
            audio.audio.setRefDistance(4);
        });
        return audio;
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
            const psoition = entity.getComponent(PositionComponent);

            if (sound.play) {
                const audio = this.getAudio(sound.src, world);
                if (audio.loaded && !audio.audio.isPlaying) {
                    audio.object.position.set(
                        psoition.x,
                        psoition.y,
                        psoition.z
                    );
                    audio.audio.play();
                }
            }
        }
    }
}
