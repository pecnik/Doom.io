import { GameState } from "../game/GameState";

export class MeshSystem {
    public update(gameState: GameState) {
        gameState.avatars.forEach(avatar => {
            avatar.mesh.position.copy(avatar.position);
            avatar.mesh.rotation.y = avatar.rotation.y;
            avatar.camera.rotation.x = avatar.rotation.x;
        });
    }
}
