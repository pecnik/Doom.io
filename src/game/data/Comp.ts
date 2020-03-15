import { Component } from "@nova-engine/ecs";
import { Vector2, Object3D, Geometry, MeshBasicMaterial } from "three";

export module Comp {
    export class Position2D extends Vector2 implements Component {}

    export class Velocity2D extends Vector2 implements Component {}

    export class Rotation2D extends Vector2 implements Component {}

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

    export class Health implements Component {
        public value = 100;
    }

    export class Render implements Component {
        public static NULL_OBJ = new Object3D();
        public static NULL_GEO = new Geometry();
        public static NULL_MAT = new MeshBasicMaterial();
        public obj = Render.NULL_GEO;
        public geo = Render.NULL_GEO;
        public mat = Render.NULL_MAT;
    }
}
