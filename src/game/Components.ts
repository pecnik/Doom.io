import { Component } from "@nova-engine/ecs";
import {
    Raycaster,
    PerspectiveCamera,
    Vector2,
    Object3D,
    PositionalAudio,
    Mesh,
    Vector3,
    Color
} from "three";

export class LocalPlayerTag implements Component {
    // Tag ...
}

export class Object3DComponent extends Object3D implements Component {
    // ...
}

export class AiComponent implements Component {
    // ...
}

export class MeshComponent implements Component {
    public src = "/assets/models/monkey.glb";
    public mesh = new Mesh();
    public color = new Color(0xffffff);
}

export class JumpComponent implements Component {
    public triggerTime = 0;
    public coyoteTime = 0;
}

export class ShooterComponent implements Component {
    public origin = new Vector2();
    public camera = new PerspectiveCamera(45);
    public raycaster = new Raycaster();
    public shootTime = 0;
}

export class BulletDecalComponent implements Component {
    public spawnTime = 0;
    public mesh = new Mesh();
    public axis: "x" | "y" | "z" = "x";
    public facing: -1 | 1 = 1;
}

export class ParticleEmitterComponent implements Component {
    public direction = new Vector3();
    public interval = 1;
    public emitTime = 0;
    public count = 0;
    public times = Number.MAX_SAFE_INTEGER;
}

export class PositionComponent extends Vector3 implements Component {
    public x = 0;
    public y = 0;
    public z = 0;
}

export class VelocityComponent extends Vector3 implements Component {
    public x = 0;
    public y = 0;
    public z = 0;
}

export class RotationComponent extends Vector2 implements Component {
    public x = 0; // Up-down
    public y = 0; // Left-right
}

export class SoundComponent {
    public channels: PositionalAudio[] = [];
    public play = false;
    public src = "";
}

export class FootstepComponent {
    public prevx = 0;
    public prevy = 0;
    public prevz = 0;
    public traveled = 0;
}

export class ControllerComponent {
    public move = new Vector2();
    public look = new Vector2();
    public jump = false;
    public shoot = false;
}
