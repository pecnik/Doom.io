import { memoize } from "lodash";
import { Settings } from "../../settings/Settings";

export class SoundAsset2D {
    public readonly audio: HTMLAudioElement;

    public constructor(src: string) {
        this.audio = new Audio(src);
        this.audio.volume = Settings.audio.masterVolume;
    }

    public play() {
        if (this.audio.currentTime > 0) {
            this.audio.currentTime = 0;
        }
        this.audio.play();
    }
}

export module Sound2D {
    export const get = memoize((path: string) => {
        return new SoundAsset2D(path);
    });
}
