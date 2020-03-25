import { Game } from "../game/core/Engine";
import { Input } from "../game/core/Input";
import { GameEditorWorld } from "./GameEditorWorld";

export class GameEditor implements Game {
    public readonly input = new Input({ requestPointerLock: true });
    public readonly world = new GameEditorWorld();

    public preload(): Promise<any> {
        return Promise.resolve();
    }

    public create() {
        console.log(`> Editor::created`);
        console.log(this.world);
    }

    public update() {
        // ...
    }
}
