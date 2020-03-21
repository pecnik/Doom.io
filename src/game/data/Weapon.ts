import { Texture } from "three";

export interface Weapon {
    readonly scope: boolean;
    readonly spread: number;
    readonly firerate: number;
    readonly knockback: number;
    readonly bulletsPerShot: number;

    readonly povSpriteSrc: string;
    povSpriteTexture?: Texture;

    readonly fireSoundSrc: string;
    fireSoundBuffer?: AudioBuffer;
}
