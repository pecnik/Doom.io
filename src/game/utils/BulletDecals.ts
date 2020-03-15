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
    public readonly scene = this.createDecalMeshPool();
    public readonly pool = this.scene.children as Mesh[];

    public spawn(point: Vector3, normal: Vector3) {
        const mesh = this.pool.find(m => !m.visible) as Mesh;
        if (mesh === undefined) return;

        // Reset mesh
        mesh.visible = true;
        mesh.rotation.set(0, 0, 0);

        // Clone position
        mesh.position.set(point.x, point.y, point.z);

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
            mesh.rotation.y = degToRad(90) * facing;
            mesh.position.z = snapToPixelgrid(mesh.position.z);
            mesh.position.y = snapToPixelgrid(mesh.position.y);
            mesh.position.x += offset;
        } else if (axis === "y") {
            mesh.rotation.x = degToRad(-90) * facing;
            mesh.position.x = snapToPixelgrid(mesh.position.x);
            mesh.position.z = snapToPixelgrid(mesh.position.z);
            mesh.position.y += offset;
        } else if (axis === "z") {
            mesh.rotation.y = facing === 1 ? 0 : degToRad(180);
            mesh.position.x = snapToPixelgrid(mesh.position.x);
            mesh.position.y = snapToPixelgrid(mesh.position.y);
            mesh.position.z += offset;
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

    private createDecalMeshPool() {
        const group = new Group();
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
                group.add(mesh);
            }
        });

        return group;
    }
}
