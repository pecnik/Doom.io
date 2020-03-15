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
        public jump = false;
        public walk = false;
        public shoot = false;
        public scope = false;
    }

    export class Shooter implements Component {
        public shootTime = 0;
    }

    export class Render implements Component {
        public static NULL_OBJ: Object3D = new Object3D();
        public static NULL_GEO: Geometry | BufferGeometry = new Geometry();
        public static NULL_MAT: MeshBasicMaterial = new MeshBasicMaterial();
        public obj = Render.NULL_OBJ;
        public geo = Render.NULL_GEO;
        public mat = Render.NULL_MAT;
    }

    export class Footstep implements Component {
        public audio?: PositionalAudio;
    }

    export class Gunshot implements Component {
        public audio?: PositionalAudio;
        public origin = new Object3D();
    }
}
