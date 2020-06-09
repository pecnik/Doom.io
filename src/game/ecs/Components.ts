import { Vector2, Vector3 } from "three";
import { PLAYER_RADIUS, PLAYER_HEIGHT } from "../data/Globals";
import { WeaponState, WeaponAmmo } from "../data/Types";
import { AvatarState } from "../data/Types";
import { WeaponType, WEAPON_SPEC_RECORD } from "../data/Weapon";

export type AnyComponents = Partial<AllComponents>;

export type AllComponents = {
    playerId: string;
    avatarTag: boolean;
    pickupTag: boolean;
    enemyAvatarTag: boolean;
    localAvatarTag: boolean;
    gravity: boolean;
    playerData: Components.PlayerData;
    position: Components.Position;
    velocity: Components.Velocity;
    rotation: Components.Rotation;
    collision: Components.Collision;
    input: Components.Input;
    shooter: Components.Shooter;
    health: Components.Health;
    jump: Components.Jump;
    avatar: Components.Avatar;
    footstep: Components.Footstep;
    entityMesh: Components.EntityMesh;
    hitIndicator: Components.HitIndicator;
    cameraShake: Components.CameraShake;
    projectile: Components.Projectile;
    pickupAmmo: Components.PickupAmmo;
    pickupHealth: Components.PickupHealth;
};

export module Components {
    export class Position extends Vector3 {}

    export class Velocity extends Vector3 {}

    export class Rotation extends Vector2 {}

    export class CameraShake extends Vector3 {}

    export class Input {
        public movey = 0;
        public movex = 0;
        public lookHor = 0;
        public lookVer = 0;
        public weaponType = WeaponType.Pistol;
        public jump = false;
        public dash = false;
        public shoot = false;
        public scope = false;
        public reloadQueue = false;
    }

    export class Collision {
        public readonly prev = new Vector3();
        public readonly next = new Vector3();
        public readonly falg = new Vector3();
        public radius = PLAYER_RADIUS;
        public height = PLAYER_HEIGHT;
    }

    export class Shooter {
        public state = WeaponState.Idle;
        public sound = WeaponState.Idle;

        public swapTime = 0;
        public shootTime = 0;
        public reloadTime = 0;
        public weaponType = WeaponType.Pistol;
        public ammo: Record<WeaponType, WeaponAmmo> = {
            [WeaponType.Pistol]: Shooter.initAmmo(WeaponType.Pistol),
            [WeaponType.Shotgun]: Shooter.initAmmo(WeaponType.Shotgun),
            [WeaponType.Machinegun]: Shooter.initAmmo(WeaponType.Machinegun),
            [WeaponType.Plasma]: Shooter.initAmmo(WeaponType.Plasma),
        };

        private static initAmmo(type: WeaponType) {
            const spec = WEAPON_SPEC_RECORD[type];
            return {
                loaded: spec.maxLoadedAmmo,
                reserved: Math.floor(spec.maxReservedAmmo / 2),
            };
        }
    }

    export class Avatar {
        public state = AvatarState.Idle;
        public prevVelocityY = 0;
    }

    export class Health {
        public value = 100;
    }

    // TODO: Rename to move
    export class Jump {
        public triggerTime = 0;
        public coyoteTime = 0;
        public doubleJump = false;
        public dashing = false;
        public dashTime = 0;
        public dashCharge = 2;
        public speed = 0;
    }

    export class PlayerData {
        public id = "";
        public name = "noname";
        public kills = 0;
        public deaths = 0;
    }

    export class Footstep {
        public stepTime = 0;
    }

    export class HitIndicator {
        public show = false;
        public time = 0;
        public origin = new Vector3();
    }

    export class EntityMesh {
        public readonly src: string;
        public objectId = -1;

        public constructor(src = "/assets/mesh/missing.glb") {
            this.src = src;
        }
    }

    export class Respawn {
        public inProgress = false;
        public time = 0;
    }

    export class Projectile {
        public spawnTime = 0;
    }

    export class PickupAmmo {
        public weaponType = WeaponType.Pistol;
        public ammo = 0;
    }

    export class PickupHealth {
        public heal = 0;
    }
}
