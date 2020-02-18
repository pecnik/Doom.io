import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../World";
import {
    VelocityComponent,
    RotationComponent,
    PositionComponent
} from "../Components";
import { Input, KeyCode } from "../../core/Input";
import { modulo } from "../../core/Utils";
import { clamp } from "lodash";

export class ControllerSystem extends System {
    private readonly avatars: Family;
    private readonly input: Input;

    public constructor(world: World, input: Input) {
        super();
        this.input = input;
        this.avatars = new FamilyBuilder(world)
            .include(VelocityComponent)
            .include(RotationComponent)
            .build();
    }

    public onAttach(world: World) {
        const avatar = new Entity();
        avatar.id = "my-avatar";
        avatar.putComponent(PositionComponent);
        avatar.putComponent(VelocityComponent);
        avatar.putComponent(RotationComponent);
        world.addEntity(avatar);
    }

    public update(world: World, dt: number) {
        for (let i = 0; i < this.avatars.entities.length; i++) {
            const avatar = this.avatars.entities[i];
            const position = avatar.getComponent(PositionComponent);
            const velocity = avatar.getComponent(VelocityComponent);
            const rotation = avatar.getComponent(RotationComponent);

            this.updateMouseLook(rotation, dt);

            const forward = this.input.isKeyDown(KeyCode.W);
            const backward = this.input.isKeyDown(KeyCode.S);
            const left = this.input.isKeyDown(KeyCode.A);
            const right = this.input.isKeyDown(KeyCode.D);

            velocity.x = 0;
            velocity.y = 0;
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
            velocity.y *= movementSpeed;
            velocity.z *= movementSpeed;

            position.x += velocity.x * dt;
            position.y += velocity.y * dt;
            position.z += velocity.z * dt;

            world.camera.position.set(position.x, position.y, position.z);
            world.camera.rotation.set(rotation.x, rotation.y, 0, "YXZ");
        }
    }

    private updateMouseLook(rotation: RotationComponent, dt: number) {
        const mouseSensitivity = 0.1;

        const lookHor = this.input.mouse.dx;
        rotation.y -= lookHor * mouseSensitivity * dt;
        rotation.y = modulo(rotation.y, Math.PI * 2);

        const lookVer = this.input.mouse.dy;
        rotation.x -= lookVer * mouseSensitivity * dt;
        rotation.x = clamp(rotation.x, -Math.PI / 2, Math.PI / 2);
    }
}
