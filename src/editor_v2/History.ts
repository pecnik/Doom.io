import { LevelJSON } from "./Level";

export class History {
    private readonly stack: string[] = [];
    private index = 0;

    public push(level: LevelJSON) {
        const json = JSON.stringify(level);
        this.stack.splice(this.index);
        this.stack.push(json);
        this.index = this.stack.length;

        const MAX_HISTORY_STACK = 10;
        if (this.stack.length > MAX_HISTORY_STACK) {
            this.stack.shift();
            this.index = MAX_HISTORY_STACK;
        }
    }

    public undo(): LevelJSON | undefined {
        const index = Math.min(this.index - 1, this.stack.length - 2);
        const json = this.stack[index];
        if (json === undefined) return;
        this.index = index;
        return JSON.parse(json) as LevelJSON;
    }

    public redo(): LevelJSON | undefined {
        const index = this.index + 1;
        const json = this.stack[index];
        if (json === undefined) return;
        this.index = index;
        return JSON.parse(json) as LevelJSON;
    }
}
