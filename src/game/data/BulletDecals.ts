import {
    Group,
    Vector3,
    PlaneGeometry,
    MeshBasicMaterial,
    Mesh,
    Object3D,
    Texture,
    AdditiveBlending,
} from "three";
import { degToRad, lerp } from "../core/Utils";
import { loadTexture } from "../Helpers";

const PIXEL = 1 / 64;
const DECAL_SIZE = PIXEL * 8;
const snapToPixelgrid = (x: number) => {
    return Math.round(x / PIXEL) * PIXEL;
};

class BulletDecal extends Object3D {
    private static readonly geometry = new PlaneGeometry(
        DECAL_SIZE,
        DECAL_SIZE,
        DECAL_SIZE
    );

    // I am a comedic genius
    public readonly hothole: MeshBasicMaterial;
    public readonly asshole: MeshBasicMaterial;

    public constructor(decalMap: Texture, decalHotMap: Texture) {
        super();

        this.asshole = new MeshBasicMaterial({
            transparent: true,
            map: decalMap,
        });

        this.hothole = new MeshBasicMaterial({
            transparent: true,
            blending: AdditiveBlending,
            map: decalHotMap,
        });

        const asshole = new Mesh(BulletDecal.geometry, this.asshole);
        const hothole = new Mesh(BulletDecal.geometry, this.hothole);
        hothole.position.z += 0.001;
        this.add(asshole, hothole);
    }
}

export class BulletDecals {
    private index = 0;

    public readonly scene = new Group();
    public readonly pool = this.scene.children as BulletDecal[];

    private next(point: Vector3) {
        for (let i = 0; i < this.pool.length; i++) {
            const decal = this.pool[i];
            const p = decal.position;
            if (Math.abs(p.x - point.x) > DECAL_SIZE) continue;
            if (Math.abs(p.y - point.y) > DECAL_SIZE) continue;
            if (Math.abs(p.z - point.z) > DECAL_SIZE) continue;
            return decal;
        }
        this.index += 1;
        this.index %= this.pool.length;
        return this.pool[this.index];
    }

    public spawn(point: Vector3, normal: Vector3) {
        // Reset mesh
        const decal = this.next(point);
        decal.visible = true;
        decal.rotation.set(0, 0, 0);

        // Reset material opacity
        decal.asshole.opacity = 1;
        decal.hothole.opacity = 1;

        // Clone position
        decal.position.copy(point);

        // Set rotation
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

    public update(_: number) {
        for (let i = 0; i < this.pool.length; i++) {
            const decal = this.pool[i];
            if (decal.visible) {
                decal.hothole.opacity = lerp(decal.hothole.opacity, 0, 0.025);
                if (decal.hothole.opacity > 0) continue;

                decal.asshole.opacity = lerp(decal.asshole.opacity, 0, 0.05);
                decal.hothole.opacity = 0;

                if (decal.asshole.opacity <= 0) {
                    decal.visible = false;
                }
            }
        }
    }

    public load() {
        Promise.all([
            loadTexture("/assets/sprites/bullet_decal.png"),
            loadTexture("/assets/sprites/bullet_decal_hot.png"),
        ]).then((maps) => {
            for (let i = 0; i < 16; i++) {
                const decal = new BulletDecal(maps[0], maps[1]);
                decal.visible = false;
                decal.renderOrder = i;
                this.scene.add(decal);
            }
        });
    }
}
