import {
    Vector2,
    Object3D,
    Geometry,
    MeshBasicMaterial,
    BufferGeometry,
    Box2,
    PositionalAudio,
    Vector3,
} from "three";
import { PLAYER_RADIUS, PLAYER_HEIGHT } from "../data/Globals";
import { WeaponState, WeaponAmmo, WeaponSpecs } from "../data/Weapon";

export type AnyComponents = Partial<AllComponents>;

export type AllComponents = {
    renderdecaltag: Comp.RenderDecalTag;
    position: Comp.Position;
    velocity: Comp.Velocity;
    rotation: Comp.Rotation2D;
    collider: Comp.Collider;
    collision: Comp.Collision;
    input: Comp.PlayerInput;
    shooter: Comp.Shooter;
    render: Comp.Render;
    footstep: Comp.Footstep;
    gunshot: Comp.Gunshot;
    health: Comp.Health;
    jump: Comp.Jump;
};

export module Comp {
    export class Position extends Vector3 {}

    export class Velocity extends Vector3 {}

    export class Rotation2D extends Vector2 {}

    export class Collider extends Box2 {}

    export class Collision {
        public readonly prev = new Vector3();
        public readonly next = new Vector3();
        public readonly falg = new Vector3();
        public radius = PLAYER_RADIUS;
        public height = PLAYER_HEIGHT;
    }

    export class PlayerInput {
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

    export class Shooter {
        public state = WeaponState.Idle;
        public swapTime = 0;
        public shootTime = 0;
        public reloadTime = 0;
        public weaponIndex = 0;
        public ammo: WeaponAmmo[] = WeaponSpecs.map((spec) => {
            return {
                loaded: spec.maxLoadedAmmo,
                reserved: spec.maxReservedAmmo,
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

    export class RenderDecalTag {}

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
}
