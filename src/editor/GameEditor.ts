import { Game } from "../game/core/Engine";
import { Input } from "../game/core/Input";
import { Scene, PerspectiveCamera } from "three";

export class GameEditor implements Game {
    public readonly input = new Input({ requestPointerLock: true });
    public readonly world = {
        scene: new Scene(),
        camera: new PerspectiveCamera(90)
    };

    public preload(): Promise<any> {
        return Promise.resolve();
    }

    public create() {
        console.log(`> Editor::created`);
    }

    public update() {
        // ...
    }
}
