import { LevelJSON } from "./Level";

export class History {
    private readonly stack: string[] = [];
    private index = 0;

    public push(level: LevelJSON) {
        const json = JSON.stringify(level);
        this.stack[this.index] = json;
        this.stack.length = this.index + 1;
        this.index++;

        const MAX_HISTORY_STACK = 10;
        if (this.stack.length > MAX_HISTORY_STACK) {
            this.stack.shift();
            this.index = MAX_HISTORY_STACK;
        }
    }

    public undo(): LevelJSON | undefined {
        if (this.index <= 1) return;

        const json = this.stack[this.index - 2];
        this.index--;
        return JSON.parse(json) as LevelJSON;
    }

    public redo(): LevelJSON | undefined {
        if (this.index >= this.stack.length) {
            return;
        }

        const json = this.stack[this.index];
        this.index++;
        return JSON.parse(json) as LevelJSON;
    }
}
