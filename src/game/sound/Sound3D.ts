import { AudioListener, PositionalAudio, AudioLoader, Group } from "three";
import { memoize } from "lodash";
import { Entity } from "../ecs";
import { Settings } from "../../settings/Settings";

export class SoundAsset3D {
    public readonly group = new Group();

    private readonly src: string;
    private buffer?: AudioBuffer;
    private index = 0;

    public constructor(src: string) {
        this.src = src;
    }

    public load(listener: AudioListener) {
        return new Promise((resolve) => {
            new AudioLoader().load(this.src, (buffer) => {
                this.buffer = buffer;
                for (let i = 0; i < 4; i++) {
                    const audio = new PositionalAudio(listener);
                    audio.setBuffer(this.buffer);
                    audio.setRefDistance(2);
                    audio.setVolume(Settings.audio.masterVolume);
                    this.group.add(audio);
                    resolve();
                }
            });
        });
    }

    public emitFrom(entity: Entity, config?: (a: PositionalAudio) => void) {
        const sound = this.group.children[this.index] as PositionalAudio;
        if (sound === undefined) return;

        if (entity.position !== undefined) {
            sound.position.copy(entity.position);
        }

        if (entity.rotation !== undefined) {
            sound.rotation.set(entity.rotation.x, entity.rotation.y, 0, "YXZ");
        }

        if (config !== undefined) {
            config(sound);
        }

        if (sound.isPlaying) sound.stop();
        sound.play(0);

        this.index += 1;
        this.index %= this.group.children.length;
    }
}

export module Sound3D {
    export const listener = new AudioListener();
    export const group = new Group();

    export const get = memoize((path: string) => {
        const sound3D = new SoundAsset3D(path);
        group.add(sound3D.group);
        return sound3D;
    });

    export function load(soundpaths: string[]) {
        const sounds3D = soundpaths.map((path) => get(path));
        return Promise.all(sounds3D.map((audio) => audio.load(listener)));
    }
}
