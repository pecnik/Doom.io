import { GameState } from "../game/GameState";
import { Input, KeyCode } from "../core/Input";
import { modulo } from "../core/Utils";

export class ControllerSystem {
    private readonly input: Input;

    public constructor(input: Input) {
        this.input = input;
    }

    public update(gameState: GameState, dt: number) {
        gameState.avatars.forEach(avatar => {
            if (avatar.isLocalPlayer !== true) {
                return;
            }

            const mouseSensitivity = 0.1;
            const lookHor = this.input.mouse.dx;
            avatar.rotation.y -= lookHor * mouseSensitivity * dt;
            avatar.rotation.y = modulo(avatar.rotation.y, Math.PI * 2);

            const forward = this.input.isKeyDown(KeyCode.W);
            const backward = this.input.isKeyDown(KeyCode.S);
            const left = this.input.isKeyDown(KeyCode.A);
            const right = this.input.isKeyDown(KeyCode.D);

            const { velocity } = avatar;
            velocity.setScalar(0);
            velocity.z -= forward ? 1 : 0;
            velocity.z += backward ? 1 : 0;
            velocity.x -= left ? 1 : 0;
            velocity.x += right ? 1 : 0;

            if (velocity.length() > 0) {
                const facingAngle = avatar.rotation.y;
                const angle = Math.atan2(velocity.z, velocity.x) - facingAngle;
                velocity.z = Math.sin(angle);
                velocity.x = Math.cos(angle);
            }

            const movementSpeed = 5;
            velocity.normalize();
            velocity.multiplyScalar(movementSpeed * dt);

            avatar.position.add(velocity);
        });
    }
}
