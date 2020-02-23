import { Color, Box3 } from "three";
export interface LevelCell {
    readonly index: number;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly ceil: boolean;
    readonly wall: boolean;
    readonly floor: boolean;
    readonly ceilId: number;
    readonly wallId: number;
    readonly floorId: number;
    readonly light: Color;
    readonly aabb: Box3;
}
