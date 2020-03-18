import { Texture } from "three";

export interface Weapon {
    povSpriteSrc: string;
    povSpriteTexture?: Texture;

    fireSoundSrc: string;
    fireSoundBuffer?: AudioBuffer;
}
