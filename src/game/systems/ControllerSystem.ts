import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../World";
import {
    VelocityComponent,
    RotationComponent,
    LocalPlayerTag
} from "../Components";
import { Input, KeyCode } from "../core/Input";
import { modulo } from "../core/Utils";
import { clamp } from "lodash";

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

        velocity.x = 0;
        velocity.z = 0;

        velocity.z -= forward ? 1 : 0;
        velocity.z += backward ? 1 : 0;

        velocity.x -= left ? 1 : 0;
        velocity.x += right ? 1 : 0;

        if (velocity.x !== 0 || velocity.z !== 0) {
            const facingAngle = rotation.y;
            const angle = Math.atan2(velocity.z, velocity.x) - facingAngle;
            velocity.z = Math.sin(angle);
            velocity.x = Math.cos(angle);
        }

        const movementSpeed = 5;
        velocity.x *= movementSpeed;
        velocity.z *= movementSpeed;
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
