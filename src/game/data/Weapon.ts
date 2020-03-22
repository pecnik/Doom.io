import { Texture } from "three";

export enum WeaponState {
    Idle,
    Swap,
    Shoot,
    Cooldown,
    Reload
}

export interface WeaponAmmo {
    loaded: number;
    reserved: number;
}

export interface WeaponSpec {
    readonly scope: boolean;
    readonly spread: number;
    readonly firerate: number;
    readonly reloadSpeed: number;
    readonly maxLoadedAmmo: number;
    readonly maxReservedAmmo: number;
    readonly knockback: number;
    readonly bulletsPerShot: number;

    readonly povSpriteSrc: string;
    povSpriteTexture?: Texture;

    readonly fireSoundSrc: string;
    fireSoundBuffer?: AudioBuffer;
}

export const WeaponSpecs: Readonly<WeaponSpec[]> = Object.freeze([
    {
        scope: true,
        spread: 0.1,
        povSpriteSrc: "/assets/sprites/pov-gun.png",
        fireSoundSrc: "/assets/sounds/fire-gun.wav",
        firerate: 1 / 3,
        reloadSpeed: 0.5,

        knockback: 0.125,
        maxLoadedAmmo: 8,
        maxReservedAmmo: 32,
        bulletsPerShot: 1
    },
    {
        scope: false,
        spread: 0.25,
        povSpriteSrc: "/assets/sprites/pov-shotgun.png",
        fireSoundSrc: "/assets/sounds/fire-shotgun.wav",
        firerate: 1,
        reloadSpeed: 1,

        knockback: 0.3,
        maxLoadedAmmo: 3,
        maxReservedAmmo: 32,
        bulletsPerShot: 4
    },
    {
        scope: false,
        spread: 0.125,
        povSpriteSrc: "/assets/sprites/pov-machine-gun.png",
        fireSoundSrc: "/assets/sounds/fire-machine-gun.wav",
        firerate: 1 / 8,
        reloadSpeed: 1.5,

        maxLoadedAmmo: 32,
        maxReservedAmmo: 128,
        knockback: 0.125 / 2,
        bulletsPerShot: 1
    }
]);
