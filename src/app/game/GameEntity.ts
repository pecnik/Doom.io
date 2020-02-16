import { Vector3 } from "three";

export interface GameEntity extends Partial<GameEntityComponents> {
    readonly id: string;
}

export interface GameEntityComponents {
    playerId: string;
    position: Vector3;
    velocity: Vector3;
    rotation: Vector3;
}

export module GameEntity {
    export class Player implements GameEntity {
        public readonly id: string;
        public readonly playerId: string;
        public constructor(playerId: string) {
            this.id = `p-${playerId}`;
            this.playerId = playerId;
        }
    }

    export class Avatar implements GameEntity {
        public readonly id: string;
        public readonly playerId: string;

        public position = new Vector3();
        public velocity = new Vector3();
        public rotation = new Vector3();

        public constructor(playerId: string) {
            this.id = `a-${playerId}`;
            this.playerId = playerId;
        }
    }
}
