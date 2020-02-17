import {
    Vector3,
    Mesh,
    CylinderGeometry,
    MeshBasicMaterial,
    PerspectiveCamera
} from "three";

export interface GameEntity extends Partial<GameEntityComponents> {
    readonly id: string;
}

export interface GameEntityComponents {
    playerId: string;
    isLocalPlayer: boolean;
    position: Vector3;
    velocity: Vector3;
    rotation: Vector3;
    mesh: Mesh;
}

export module GameEntity {
    export class Player implements GameEntity {
        public readonly id: string;
        public readonly playerId: string;

        public isLocalPlayer = false;

        public constructor(playerId: string) {
            this.id = `p-${playerId}`;
            this.playerId = playerId;
        }
    }

    export class Avatar implements GameEntity {
        public readonly id: string;
        public readonly playerId: string;

        public isLocalPlayer = false;
        public position = new Vector3();
        public velocity = new Vector3();
        public rotation = new Vector3();

        public camera = new PerspectiveCamera(90);
        public mesh = new Mesh(
            new CylinderGeometry(0.25, 0.25, 1, 12),
            new MeshBasicMaterial({
                color: 0xffffff,
                wireframe: true
            })
        );

        public constructor(playerId: string) {
            this.id = `a-${playerId}`;
            this.playerId = playerId;
        }
    }
}
