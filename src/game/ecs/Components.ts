import {
    Vector2,
    Object3D,
    Geometry,
    MeshBasicMaterial,
    BufferGeometry,
    Vector3,
} from "three";
import { PLAYER_RADIUS, PLAYER_HEIGHT } from "../data/Globals";
import { WeaponState, WeaponAmmo } from "../data/Types";
import { Netcode } from "../Netcode";
import { AvatarState } from "../data/Types";
import { WeaponType, WEAPON_SPEC_RECORD } from "../data/Weapon";

export type AnyComponents = Partial<AllComponents>;

export type AllComponents = {
    socketId: string;
    avatarTag: boolean;
    playerId: string;
    playerData: Components.PlayerData;
    eventsBuffer: Netcode.Event[];
    position: Components.Position;
    velocity: Components.Velocity;
    rotation: Components.Rotation;
    collision: Components.Collision;
    input: Components.Input;
    shooter: Components.Shooter;
    render: Components.Render;
    health: Components.Health;
    jump: Components.Jump;
    pickup: Components.Pickup;
    avatar: Components.Avatar;
    avatarSpawner: Components.AvatarSpawner;
    footstep: Components.Footstep;
};

export module Components {
    export class Position extends Vector3 {}

    export class Velocity extends Vector3 {}

    export class Rotation extends Vector2 {}

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
        public reload = false;
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

    export class Render {
        public static Geo: Geometry | BufferGeometry = new Geometry();
        public static Mat: MeshBasicMaterial = new MeshBasicMaterial();
        public obj = new Object3D();
        public geo = Render.Geo;
        public mat = Render.Mat;
    }

    export class Health {
        public value = 100;
    }

    export class Jump {
        public triggerTime = 0;
        public coyoteTime = 0;
        public doubleJump = false;
        public dashing = false;
        public dashTime = 0;
        public dashCharge = 2;
    }

    export enum PickupType {
        Ammo,
        Health,
    }

    export class Pickup {
        public type = PickupType.Ammo;
        public weaponType = WeaponType.Pistol;
    }

    export class PlayerData {
        public id = "";
        public name = "noname";
        public kills = 0;
        public deaths = 0;
    }

    export class AvatarSpawner {
        public spawnTime = 0;
    }

    export class Footstep {
        public stepTime = 0;
    }
}
