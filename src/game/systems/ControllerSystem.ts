import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../World";
import { Input, KeyCode } from "../core/Input";
import { modulo, lerp } from "../core/Utils";
import { clamp } from "lodash";
import {
    VelocityComponent,
    RotationComponent,
    LocalPlayerTag
} from "../Components";
import { Vector2 } from "three";
import { RUN_SPEED, WALK_SPEED } from "../Globals";

export class ControllerSystem extends System {
    private readonly family: Family;
    private readonly input: Input;

    public constructor(world: World, input: Input) {
        super();
        this.input = input;
        this.family = new FamilyBuilder(world)
            .include(LocalPlayerTag)
            .include(VelocityComponent)
            .include(RotationComponent)
            .build();
    }

    public update(_: World, dt: number) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const velocity = entity.getComponent(VelocityComponent);
            const rotation = entity.getComponent(RotationComponent);
            this.mouseLook(rotation, dt);
            this.movement(velocity, rotation);
        }
    }

    private movement(velocity: VelocityComponent, rotation: RotationComponent) {
        const forward = this.input.isKeyDown(KeyCode.W);
        const backward = this.input.isKeyDown(KeyCode.S);
        const left = this.input.isKeyDown(KeyCode.A);
        const right = this.input.isKeyDown(KeyCode.D);

        const movement = new Vector2();

        const speed = this.input.isKeyDown(KeyCode.SHIFT)
            ? WALK_SPEED
            : RUN_SPEED;

        movement.y -= forward ? speed : 0;
        movement.y += backward ? speed : 0;

        movement.x -= left ? speed : 0;
        movement.x += right ? speed : 0;

        if (movement.x !== 0 || movement.y !== 0) {
            movement.rotateAround(new Vector2(), -rotation.y);
        }

        velocity.x = lerp(velocity.x, movement.x, RUN_SPEED / 4);
        velocity.z = lerp(velocity.z, movement.y, RUN_SPEED / 4);
    }

    private mouseLook(rotation: RotationComponent, dt: number) {
        const mouseSensitivity = 0.1;

        const lookHor = this.input.mouse.dx;
        rotation.y -= lookHor * mouseSensitivity * dt;
        rotation.y = modulo(rotation.y, Math.PI * 2);

        const lookVer = this.input.mouse.dy;
        rotation.x -= lookVer * mouseSensitivity * dt;
        rotation.x = clamp(rotation.x, -Math.PI / 2, Math.PI / 2);
    }
}
