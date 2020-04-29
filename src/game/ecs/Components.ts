import {
    Vector2,
    Object3D,
    Geometry,
    MeshBasicMaterial,
    BufferGeometry,
    PositionalAudio,
    Vector3,
} from "three";
import { PLAYER_RADIUS, PLAYER_HEIGHT } from "../data/Globals";
import { WeaponState, WeaponAmmo, WeaponSpecs } from "../weapons/Weapon";
import { Netcode } from "../Netcode";

export type AnyComponents = Partial<AllComponents>;

export type AllComponents = {
    socketId: string;
    avatarTag: boolean;
    playerId: string;
    playerData: Comp.PlayerData;
    eventsBuffer: Netcode.Event[];
    position: Comp.Position;
    velocity: Comp.Velocity;
    rotation: Comp.Rotation;
    collision: Comp.Collision;
    input: Comp.Input;
    shooter: Comp.Shooter;
    render: Comp.Render;
    footstep: Comp.Footstep;
    gunshot: Comp.Gunshot;
    health: Comp.Health;
    jump: Comp.Jump;
    pickup: Comp.Pickup;
    avatarSpawner: Comp.AvatarSpawner;
};

export module Comp {
    export class Position extends Vector3 {}

    export class Velocity extends Vector3 {}

    export class Rotation extends Vector2 {}

    export class Input {
        public movey = 0;
        public movex = 0;
        public lookHor = 0;
        public lookVer = 0;
        public weaponIndex = 0;
        public jump = false;
        public crouch = false;
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
        public swapTime = 0;
        public shootTime = 0;
        public reloadTime = 0;
        public weaponIndex = 0;
        public ammo: WeaponAmmo[] = WeaponSpecs.map((spec) => {
            return {
                loaded: spec.maxLoadedAmmo,
                reserved: 0,
            };
        });
    }

    export class Render {
        public static Geo: Geometry | BufferGeometry = new Geometry();
        public static Mat: MeshBasicMaterial = new MeshBasicMaterial();
        public obj = new Object3D();
        public geo = Render.Geo;
        public mat = Render.Mat;
    }

    export class Footstep {
        public audio?: PositionalAudio;
    }

    export class Gunshot {
        public audio?: PositionalAudio;
        public origin = new Object3D();
    }

    export class Health {
        public value = 100;
    }

    export class Jump {
        public triggerTime = 0;
        public coyoteTime = 0;
    }

    export enum PickupType {
        Ammo,
        Health,
    }

    export class Pickup {
        public type = PickupType.Ammo;
        public weaponIndex = 0;
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
}
