import {
    Vector3,
    Object3D,
    Mesh,
    CylinderGeometry,
    MeshBasicMaterial
} from "three";

export interface GameEntity extends Partial<GameEntityComponents> {
    readonly id: string;
}

export interface GameEntityComponents {
    playerId: string;
    position: Vector3;
    velocity: Vector3;
    rotation: Vector3;
    model: Object3D;
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
        public model = new Object3D();

        public constructor(playerId: string) {
            this.id = `a-${playerId}`;
            this.playerId = playerId;
            this.model.add(
                new Mesh(
                    new CylinderGeometry(0.25, 0.25, 1, 12),
                    new MeshBasicMaterial({ color: 0xffffff, wireframe: true })
                )
            );
        }
    }
}
