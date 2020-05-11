export enum AvatarState {
    Idle,
    Walk,
    Jump,
    Land,
}

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
