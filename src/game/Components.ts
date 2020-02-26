import { Component } from "@nova-engine/ecs";
import {
    Raycaster,
    PerspectiveCamera,
    Vector2,
    Object3D,
    PositionalAudio
} from "three";

export class LocalPlayerTag implements Component {
    // Tag ...
}

export class MeshComponent implements Component {
    // Tag ...
}

export class Object3DComponent extends Object3D implements Component {
    // ...
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

export class PositionComponent implements Component {
    public x = 0;
    public y = 0;
    public z = 0;
}

export class VelocityComponent implements Component {
    public x = 0;
    public y = 0;
    public z = 0;
}

export class RotationComponent implements Component {
    public x = 0; // Up-down
    public y = 0; // Left-right
}

export class SoundComponent {
    public audio?: PositionalAudio;
    public play = false;
    public src = "";
}

export class FootstepComponent {
    public prevx = 0;
    public prevz = 0;
    public traveled = 0;
}
