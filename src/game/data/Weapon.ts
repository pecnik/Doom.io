import { Texture } from "three";

export interface Weapon {
    scope: boolean;
    spread: number;
    firerate: number;
    knockback: number;
    bulletsPerShot: number;

    povSpriteSrc: string;
    povSpriteTexture?: Texture;

    fireSoundSrc: string;
    fireSoundBuffer?: AudioBuffer;
}
