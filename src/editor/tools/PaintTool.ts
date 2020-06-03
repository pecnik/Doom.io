import { KeyCode, MouseBtn } from "../../game/core/Input";
import { Tool } from "./Tool";
import { getNormalAxis } from "../../game/Helpers";
import { LevelBlock } from "../Level";
import { Vector3, Color } from "three";
import { MoveTool } from "./MoveTool";
import { SampleTool } from "./SampleTool";
import { Cursor3D } from "./Cursor3D";

export class PaintTool extends Tool {
    public readonly name = "Paint tool";
    public readonly hotkey = KeyCode.F;
    public readonly cursorType = "tool-cursor-paint";

    private readonly cursor = new Cursor3D(this.editor, {
        sampleDir: -1,
        color: new Color(1, 1, 1),
        type: "face",
    });

    public initialize() {
        this.editor.scene.add(this.cursor);
    }

    public start() {
        this.cursor.visible = true;
    }

    public end() {
        this.cursor.visible = false;
    }

    public getModifiedTool(): Tool {
        if (this.editor.input.isKeyDown(KeyCode.SPACE)) {
            return this.editor.tools.get(MoveTool);
        }

        if (this.editor.input.isKeyDown(KeyCode.ALT)) {
            return this.editor.tools.get(SampleTool);
        }

        return this;
    }

    public update() {
        this.cursor.update();
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

        const face = block.getFaceIndex(normal);

        // Build 2D buffer
        const buffer: number[][] = [];
        const x = block.origin.x;
        for (let y = 0; y < level.height; y++) {
            buffer[y] = [];
            for (let z = 0; z < level.depth; z++) {
                buffer[y][z] = -1;

                const block = level.getBlock(x, y, z);
                if (block === undefined) continue;
                if (block.solid === false) continue;

                const edge = level.getBlock(x + normal.x, y, z);
                if (edge && edge.solid) continue;

                buffer[y][z] = block.faces[face];
            }
        }

        // Flood fill
        this.floodFill(buffer, {
            x: block.origin.y,
            y: block.origin.z,
            fill: tileId,
        });

        // Update level faces
        for (let y = 0; y < level.height; y++) {
            for (let z = 0; z < level.depth; z++) {
                const block = level.getBlock(x, y, z);
                if (block && buffer[y][z] !== -1) {
                    block.faces[face] = buffer[y][z];
                }
            }
        }
    }

    private floodFillY(block: LevelBlock, normal: Vector3, tileId: number) {
        const { level } = this.editor;

        // Build 2D buffer
        const face = block.getFaceIndex(normal);
        const y = block.origin.y;
        const buffer: number[][] = [];
        for (let x = 0; x < level.width; x++) {
            buffer[x] = [];
            for (let z = 0; z < level.depth; z++) {
                buffer[x][z] = -1;

                const block = level.getBlock(x, y, z);
                if (block === undefined) continue;
                if (block.solid === false) continue;

                const edge = level.getBlock(x, y + normal.y, z);
                if (edge && edge.solid) continue;

                buffer[x][z] = block.faces[face];
            }
        }

        // Flood fill
        this.floodFill(buffer, {
            x: block.origin.x,
            y: block.origin.z,
            fill: tileId,
        });

        // Update level faces
        for (let x = 0; x < level.width; x++) {
            for (let z = 0; z < level.depth; z++) {
                const block = level.getBlock(x, y, z);
                if (block && buffer[x][z] !== -1) {
                    block.faces[face] = buffer[x][z];
                }
            }
        }
    }

    private floodFillZ(block: LevelBlock, normal: Vector3, tileId: number) {
        const { level } = this.editor;

        // Build 2D buffer
        const face = block.getFaceIndex(normal);
        const z = block.origin.z;
        const buffer: number[][] = [];
        for (let x = 0; x < level.width; x++) {
            buffer[x] = [];
            for (let y = 0; y < level.height; y++) {
                buffer[x][y] = -1;

                const block = level.getBlock(x, y, z);
                if (block === undefined) continue;
                if (block.solid === false) continue;

                const edge = level.getBlock(x, y, z + normal.z);
                if (edge && edge.solid) continue;

                buffer[x][y] = block.faces[face];
            }
        }

        // Flood fill
        this.floodFill(buffer, {
            x: block.origin.x,
            y: block.origin.y,
            fill: tileId,
        });

        // Update level faces
        for (let x = 0; x < level.width; x++) {
            for (let y = 0; y < level.height; y++) {
                const block = level.getBlock(x, y, z);
                if (block && buffer[x][y] !== -1) {
                    block.faces[face] = buffer[x][y];
                }
            }
        }
    }

    private floodFill(
        buffer: number[][],
        data: {
            x: number;
            y: number;
            fill: number;
        }
    ) {
        const { x, y, fill } = data;

        type Point = { x: number; y: number };

        const target = buffer[x][y];
        const stack: Point[] = [];
        const pushValid = (x: number, y: number) => {
            if (buffer[x] === undefined) return;
            if (buffer[x][y] !== target) return;
            stack.push({ x, y });
        };

        const floodFill = (x: number, y: number) => {
            buffer[x][y] = fill;
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
