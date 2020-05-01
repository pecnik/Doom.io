export enum AvatarState {
    Idle,
    Walk,
    Jump,
    Land,
}

import { Texture } from "three";

export enum WeaponState {
    Idle,
    Swap,
    Shoot,
    Cooldown,
    Reload,
}

export interface WeaponAmmo {
    loaded: number;
    reserved: number;
}

export interface WeaponSpec {
    readonly name: string;
    readonly scope: boolean;
    readonly spread: number;
    readonly firerate: number;
    readonly reloadSpeed: number;
    readonly maxLoadedAmmo: number;
    readonly maxReservedAmmo: number;
    readonly knockback: number;
    readonly bulletsPerShot: number;
    readonly bulletDamage: number;

    readonly ammoPackName: string;

    readonly povSpriteSrc: string;
    povSpriteTexture?: Texture;

    readonly fireSoundSrc: string;
    fireSoundBuffer?: AudioBuffer;
}

export const WeaponSpecs: Readonly<WeaponSpec[]> = Object.freeze([
    {
        name: "Hand gun",
        scope: true,
        spread: 0.1,
        povSpriteSrc: "/assets/sprites/pov-gun.png",
        fireSoundSrc: "/assets/sounds/fire-gun.wav",
        ammoPackName: "__AMMO_GUN__",
        firerate: 1 / 3,
        reloadSpeed: 2,

        knockback: 0.125,
        maxLoadedAmmo: 8,
        maxReservedAmmo: 32,
        bulletsPerShot: 1,
        bulletDamage: 18,
    },
    {
        name: "Shotgun",
        scope: false,
        spread: 0.25,
        povSpriteSrc: "/assets/sprites/pov-shotgun.png",
        fireSoundSrc: "/assets/sounds/fire-shotgun.wav",
        ammoPackName: "__AMMO_SHOTGUN__",
        firerate: 0.75,
        reloadSpeed: 2,

        knockback: 0.3,
        maxLoadedAmmo: 2,
        maxReservedAmmo: 32,
        bulletsPerShot: 4,
        bulletDamage: 25,
    },
    {
        name: "Machinegun",
        scope: false,
        spread: 0.125,
        povSpriteSrc: "/assets/sprites/pov-machine-gun.png",
        fireSoundSrc: "/assets/sounds/fire-machine-gun.wav",
        ammoPackName: "__AMMO_MACHINEGUN__",
        firerate: 1 / 16,
        reloadSpeed: 3,

        maxLoadedAmmo: 20,
        maxReservedAmmo: 60,
        knockback: 0.125 / 2,
        bulletsPerShot: 1,
        bulletDamage: 20,
    },
]);
