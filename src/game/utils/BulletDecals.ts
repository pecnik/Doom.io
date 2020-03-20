import {
    Group,
    Vector3,
    NearestFilter,
    TextureLoader,
    PlaneGeometry,
    MeshBasicMaterial,
    Mesh
} from "three";
import { degToRad, lerp } from "../core/Utils";

const PIXEL = 1 / 64;
const DECAL_SIZE = PIXEL * 8;
const snapToPixelgrid = (x: number) => {
    return Math.round(x / PIXEL) * PIXEL;
};

export class BulletDecals {
    private index = 0;

    public readonly scene = new Group();
    public readonly pool = this.scene.children as Mesh[];

    public spawn(point: Vector3, normal: Vector3) {
        this.index += 1;
        this.index %= this.pool.length;

        // Reset mesh
        const decal = this.pool[this.index];
        decal.visible = true;
        decal.rotation.set(0, 0, 0);

        // Reset material opacity
        const material = decal.material as MeshBasicMaterial;
        material.opacity = 1;

        // Clone position
        decal.position.copy(point);

        let axis: "x" | "y" | "z" = "x";
        let facing = 1;

        if (Math.abs(normal.x) === 1) {
            axis = "x";
            facing = normal.x as -1 | 1;
        } else if (Math.abs(normal.y) === 1) {
            axis = "y";
            facing = normal.y as -1 | 1;
        } else if (Math.abs(normal.z) === 1) {
            axis = "z";
            facing = normal.z as -1 | 1;
        }

        // Match wall surface
        const offset = (1 / 1024) * facing;
        if (axis === "x") {
            decal.rotation.y = degToRad(90) * facing;
            decal.position.z = snapToPixelgrid(decal.position.z);
            decal.position.y = snapToPixelgrid(decal.position.y);
            decal.position.x += offset;
        } else if (axis === "y") {
            decal.rotation.x = degToRad(-90) * facing;
            decal.position.x = snapToPixelgrid(decal.position.x);
            decal.position.z = snapToPixelgrid(decal.position.z);
            decal.position.y += offset;
        } else if (axis === "z") {
            decal.rotation.y = facing === 1 ? 0 : degToRad(180);
            decal.position.x = snapToPixelgrid(decal.position.x);
            decal.position.y = snapToPixelgrid(decal.position.y);
            decal.position.z += offset;
        }
    }

    public update(dt: number) {
        for (let i = 0; i < this.pool.length; i++) {
            const decal = this.pool[i];
            if (decal.visible) {
                const material = decal.material as MeshBasicMaterial;
                material.opacity = lerp(material.opacity, 0, dt * 0.3);

                if (material.opacity <= 0) {
                    decal.visible = false;
                    material.opacity = 1;
                }
            }
        }
    }

    public load() {
        const geometry = new PlaneGeometry(DECAL_SIZE, DECAL_SIZE, DECAL_SIZE);

        new TextureLoader().load("/assets/sprites/bullet_decal.png", map => {
            // Fill pool
            for (let i = 0; i < 16; i++) {
                const material = new MeshBasicMaterial({
                    map,
                    opacity: 1,
                    transparent: true
                });
                map.minFilter = NearestFilter;
                map.magFilter = NearestFilter;

                const mesh = new Mesh(geometry, material);
                mesh.visible = false;
                this.scene.add(mesh);
            }
        });
    }
}
