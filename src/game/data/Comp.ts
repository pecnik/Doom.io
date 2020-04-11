import { Component } from "../core/ecs";
import { uniqueId } from "lodash";
import {
    Vector2,
    Object3D,
    Geometry,
    MeshBasicMaterial,
    BufferGeometry,
    Box2,
    PositionalAudio,
    Vector3
} from "three";
import { WeaponSpecs, WeaponState, WeaponAmmo } from "./Weapon";

export module Comp {
    const NEXT_TAG = () => uniqueId("comp-tag");

    export class Position extends Vector3 implements Component {
        public static readonly tag = NEXT_TAG();
    }

    export class Velocity extends Vector3 implements Component {
        public static readonly tag = NEXT_TAG();
    }

    export class Rotation2D extends Vector2 implements Component {
        public static readonly tag = NEXT_TAG();
    }

    export class Collider extends Box2 implements Component {
        public static readonly tag = NEXT_TAG();
    }

    export class Collision implements Component {
        public static readonly tag = NEXT_TAG();
        public readonly prev = new Vector3();
        public readonly next = new Vector3();
        public readonly falg = new Vector3();
        public radius = 0.25;
        public height = 1.5;
    }

    export class PlayerInput implements Component {
        public static readonly tag = NEXT_TAG();
        public movey = 0;
        public movex = 0;
        public lookHor = 0;
        public lookVer = 0;
        public weaponIndex = 0;
        public jump = false;
        public walk = false;
        public shoot = false;
        public scope = false;
        public reload = false;
    }

    export class Shooter implements Component {
        public static readonly tag = NEXT_TAG();
        public state = WeaponState.Idle;
        public swapTime = 0;
        public shootTime = 0;
        public reloadTime = 0;
        public weaponIndex = 0;
        public ammo: WeaponAmmo[] = WeaponSpecs.map(spec => {
            return {
                loaded: spec.maxLoadedAmmo,
                reserved: spec.maxReservedAmmo
            };
        });
    }

    export class Render implements Component {
        public static readonly tag = NEXT_TAG();
        public static Geo: Geometry | BufferGeometry = new Geometry();
        public static Mat: MeshBasicMaterial = new MeshBasicMaterial();
        public obj = new Object3D();
        public geo = Render.Geo;
        public mat = Render.Mat;
    }

    export class RenderDecalTag implements Component {
        public static readonly tag = NEXT_TAG();
    }

    export class Footstep implements Component {
        public static readonly tag = NEXT_TAG();
        public audio?: PositionalAudio;
    }

    export class Gunshot implements Component {
        public static readonly tag = NEXT_TAG();
        public audio?: PositionalAudio;
        public origin = new Object3D();
    }

    export class Health implements Component {
        public static readonly tag = NEXT_TAG();
        public value = 100;
    }

    export class Jump implements Component {
        public static readonly tag = NEXT_TAG();
        public triggerTime = 0;
        public coyoteTime = 0;
    }
}
