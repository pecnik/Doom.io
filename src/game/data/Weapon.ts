import { Texture } from "three";

export interface Weapon {
    firerate: number;

    povSpriteSrc: string;
    povSpriteTexture?: Texture;

    fireSoundSrc: string;
    fireSoundBuffer?: AudioBuffer;
}
