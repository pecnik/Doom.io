import { Component } from "@nova-engine/ecs";
import { PositionalAudio } from "three";

export class LocalPlayerTag implements Component {
    // ...
}

export class ModelComponent implements Component {
    // ...
}

export class JumpComponent implements Component {
    public triggerTime = -Number.MAX_SAFE_INTEGER;
    public coyoteTime = -Number.MAX_SAFE_INTEGER;
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
    public play = false;
    public src = "";
}
