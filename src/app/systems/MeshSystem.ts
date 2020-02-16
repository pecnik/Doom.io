import { GameState } from "../game/GameState";

export class MeshSystem {
    public update(gameState: GameState) {
        gameState.avatars.forEach(avatar => {
            if (avatar.camera.parent === null) {
                avatar.mesh.add(avatar.camera);
            }

            if (avatar.mesh.parent === null) {
                gameState.scene.add(avatar.mesh);
            }

            avatar.mesh.position.copy(avatar.position);
            avatar.mesh.rotation.y = avatar.rotation.y;
            avatar.camera.rotation.x = avatar.rotation.x;
        });
    }
}
