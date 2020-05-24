import { Tool, ToolType } from "./Tool";
import { KeyCode, MouseBtn } from "../../game/core/Input";
import { Level, LevelBlock } from "../Level";
import { Editor } from "../Editor";
import { Vector3 } from "three";
import { getNormalAxis } from "../../game/Helpers";

enum Cell {
    Wall,
    Empty,
    Filled,
}

export class PaintTool extends Tool {
    public readonly name = "Paint tool";
    public readonly type = ToolType.Paint;
    public readonly hotkey = KeyCode.F;

    private readonly brush = new Level();
    private readonly state = {
        drawing: false,
        v1: new Vector3(),
        v2: new Vector3(),
    };

    public constructor(editor: Editor) {
        super(editor);
        editor.scene.add(this.brush.mesh);
        this.brush.loadMaterial();
    }

    public start() {
        this.brush.resize(
            this.editor.level.width,
            this.editor.level.height,
            this.editor.level.depth
        );
        this.brush.updateGeometry();
        this.brush.mesh.visible = true;
        this.state.drawing = false;
    }

    public end() {
        this.brush.mesh.visible = false;
    }

    public update() {
        const tileId = this.editor.store.state.paint.tileId;

        if (this.input.isMousePresed(MouseBtn.Right)) {
            const rsp = this.editor.sampleBlock(-1);
            if (rsp === undefined) return;

            const block = rsp.block;
            const face = rsp.block.getFaceIndex(rsp.normal);
            block.faces[face] = tileId;
            this.editor.level.updateGeometry();
            return;
        }

        if (this.input.isMousePresed(MouseBtn.Left)) {
            const rsp = this.editor.sampleBlock(-1);
            if (rsp === undefined) return;

            switch (getNormalAxis(rsp.normal)) {
                case "x":
                    this.floodFillX(rsp.block, rsp.normal, tileId);
                    this.editor.level.updateGeometry();
                    return;

                case "y":
                    this.floodFillY(rsp.block, rsp.normal, tileId);
                    this.editor.level.updateGeometry();
                    return;

                case "z":
                    this.floodFillZ(rsp.block, rsp.normal, tileId);
                    this.editor.level.updateGeometry();
                    return;
            }
        }
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
