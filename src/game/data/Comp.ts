import { Component } from "@nova-engine/ecs";
import {
    Vector2,
    Object3D,
    Geometry,
    MeshBasicMaterial,
    BufferGeometry,
    Box2,
    PositionalAudio
} from "three";

export module Comp {
    export class Position2D extends Vector2 implements Component {}

    export class Velocity2D extends Vector2 implements Component {}

    export class Rotation2D extends Vector2 implements Component {}

    export class Collider extends Box2 implements Component {}

    export class Collision implements Component {
        public readonly prev = new Vector2();
        public readonly next = new Vector2();
        public radius = 0.2;
    }

    export class PlayerInput implements Component {
        public movey = 0;
        public movex = 0;
        public lookHor = 0;
        public lookVer = 0;
        public nextWeapon: -1 | 0 | 1 = 0;
        public jump = false;
        public walk = false;
        public shoot = false;
        public scope = false;
    }

    export class Shooter implements Component {
        public swapTime = 0;
        public shootTime = 0;
        public weaponIndex = 0;
    }

    export class Render implements Component {
        public static Geo: Geometry | BufferGeometry = new Geometry();
        public static Mat: MeshBasicMaterial = new MeshBasicMaterial();
        public obj = new Object3D();
        public geo = Render.Geo;
        public mat = Render.Mat;
    }

    export class Footstep implements Component {
        public audio?: PositionalAudio;
    }

    export class Gunshot implements Component {
        public audio?: PositionalAudio;
        public origin = new Object3D();
    }
}
