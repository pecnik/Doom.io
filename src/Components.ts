import { Component } from "@nova-engine/ecs";

export class LocalPlayerTag implements Component {
    // ...
}

export class ModelComponent implements Component {
    // ...
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
