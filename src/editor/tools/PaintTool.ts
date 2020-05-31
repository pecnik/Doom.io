import { KeyCode, MouseBtn } from "../../game/core/Input";
import { Tool } from "./Tool";
import { getNormalAxis } from "../../game/Helpers";
import { LevelBlock } from "../Level";
import { Vector3 } from "three";
import { MoveTool } from "./MoveTool";
import { SampleTool } from "./SampleTool";

enum Cell {
    Wall,
    Empty,
    Filled,
}

export class PaintTool extends Tool {
    public readonly name = "Paint tool";
    public readonly hotkey = KeyCode.G;
    public readonly cursorType = "tool-cursor-paint";

    public getModifiedTool(): Tool {
        if (this.editor.input.isKeyDown(KeyCode.SPACE)) {
            return this.editor.tools.get(MoveTool);
        }

        if (this.editor.input.isKeyDown(KeyCode.ALT)) {
            return this.editor.tools.get(SampleTool);
        }

        return this;
    }

    public onPresed() {
        const rsp = this.editor.sampleBlock(-1);
        if (rsp === undefined) return;

        if (this.editor.input.isMousePresed(MouseBtn.Left)) {
            this.editor.commitLevelMutation(() => {
                const { tileId } = this.editor.store.state;
                const block = rsp.block;
                const face = rsp.block.getFaceIndex(rsp.normal);
                block.faces[face] = tileId;
            });
            return;
        }

        this.editor.commitLevelMutation(() => {
            const { tileId } = this.editor.store.state;
            switch (getNormalAxis(rsp.normal)) {
                case "x":
                    this.floodFillX(rsp.block, rsp.normal, tileId);
                    return;

                case "y":
                    this.floodFillY(rsp.block, rsp.normal, tileId);
                    return;

                case "z":
                    this.floodFillZ(rsp.block, rsp.normal, tileId);
                    return;
            }
        });
    }

    private floodFillX(block: LevelBlock, normal: Vector3, tileId: number) {
        const { level } = this.editor;

        // Build 2D buffer
        const buffer: Cell[][] = [];
        const x = block.origin.x;
        for (let y = 0; y < level.height; y++) {
            buffer[y] = [];
            for (let z = 0; z < level.depth; z++) {
                buffer[y][z] = Cell.Wall;

                const block = level.getBlock(x, y, z);
                if (block === undefined) continue;
                if (block.solid === false) continue;

                const edge = level.getBlock(x + normal.x, y, z);
                if (edge && edge.solid) continue;

                buffer[y][z] = Cell.Empty;
            }
        }

        // Flood fill
        this.floodFill(buffer, block.origin.y, block.origin.z);

        // Update level faces
        const face = block.getFaceIndex(normal);
        for (let y = 0; y < level.height; y++) {
            for (let z = 0; z < level.depth; z++) {
                const block = level.getBlock(x, y, z);
                if (block && buffer[y][z] === Cell.Filled) {
                    block.faces[face] = tileId;
                }
            }
        }
    }

    private floodFillY(block: LevelBlock, normal: Vector3, tileId: number) {
        const { level } = this.editor;

        // Build 2D buffer
        const y = block.origin.y;
        const buffer: Cell[][] = [];
        for (let x = 0; x < level.width; x++) {
            buffer[x] = [];
            for (let z = 0; z < level.depth; z++) {
                buffer[x][z] = Cell.Wall;

                const block = level.getBlock(x, y, z);
                if (block === undefined) continue;
                if (block.solid === false) continue;

                const edge = level.getBlock(x, y + normal.y, z);
                if (edge && edge.solid) continue;

                buffer[x][z] = Cell.Empty;
            }
        }

        // Flood fill
        this.floodFill(buffer, block.origin.x, block.origin.z);

        // Update level faces
        const face = block.getFaceIndex(normal);
        for (let x = 0; x < level.width; x++) {
            for (let z = 0; z < level.depth; z++) {
                const block = level.getBlock(x, y, z);
                if (block && buffer[x][z] === Cell.Filled) {
                    block.faces[face] = tileId;
                }
            }
        }
    }

    private floodFillZ(block: LevelBlock, normal: Vector3, tileId: number) {
        const { level } = this.editor;

        // Build 2D buffer
        const z = block.origin.z;
        const buffer: Cell[][] = [];
        for (let x = 0; x < level.width; x++) {
            buffer[x] = [];
            for (let y = 0; y < level.height; y++) {
                buffer[x][y] = Cell.Wall;

                const block = level.getBlock(x, y, z);
                if (block === undefined) continue;
                if (block.solid === false) continue;

                const edge = level.getBlock(x, y, z + normal.z);
                if (edge && edge.solid) continue;

                buffer[x][y] = Cell.Empty;
            }
        }

        // Flood fill
        this.floodFill(buffer, block.origin.x, block.origin.y);

        // Update level faces
        const face = block.getFaceIndex(normal);
        for (let x = 0; x < level.width; x++) {
            for (let y = 0; y < level.height; y++) {
                const block = level.getBlock(x, y, z);
                if (block && buffer[x][y] === Cell.Filled) {
                    block.faces[face] = tileId;
                }
            }
        }
    }

    private floodFill(buffer: Cell[][], x: number, y: number) {
        type Point = { x: number; y: number };

        const stack: Point[] = [];
        const pushValid = (x: number, y: number) => {
            if (buffer[x] === undefined) return;
            if (buffer[x][y] !== Cell.Empty) return;
            stack.push({ x, y });
        };

        const floodFill = (x: number, y: number) => {
            buffer[x][y] = Cell.Filled;
            pushValid(x - 1, y);
            pushValid(x + 1, y);
            pushValid(x, y - 1);
            pushValid(x, y + 1);

            const last = stack.pop();
            if (last !== undefined) {
                floodFill(last.x, last.y);
            }
        };

        floodFill(x, y);
    }
}
