import { Vector3, Geometry, PointsMaterial, Points, Texture } from "three";
import { random } from "lodash";
import { GRAVITY } from "./Globals";
import { World } from "../ecs";
import { loadTexture } from "../Helpers";

export class Particle extends Vector3 {
    public readonly velocity = new Vector3();
}

export class Particles {
    public readonly scene: Points;

    private readonly count = 128;
    private readonly geometry = new Geometry();
    private index = 0;

    public constructor() {
        // Init gemoerty
        for (let p = 0; p < this.count; p++) {
            this.geometry.vertices.push(new Particle(0, -2, 0));
        }

        // Init material
        const material = new PointsMaterial({
            transparent: true,
            size: 1 / 8,
            map: new Texture(),
        });

        loadTexture("/assets/sprites/blood.png").then((map) => {
            material.map = map;
            material.needsUpdate = true;
        });

        this.scene = new Points(this.geometry, material);
        this.scene.frustumCulled = false;
    }

    public blood(point: Vector3, normal: Vector3) {
        const particles = this.geometry.vertices as Particle[];

        for (let i = 0; i < 8; i++) {
            this.index += 1;
            this.index %= this.count;

            const speed = 1 + (i + 1) * 0.25;
            const rand = 0.25;

            const particle = particles[this.index];
            particle.copy(point);
            particle.velocity.copy(normal);
            particle.velocity.normalize();
            particle.velocity.x += random(-rand, rand, true);
            particle.velocity.y += random(-rand, rand * 5, true);
            particle.velocity.z += random(-rand, rand, true);
            particle.velocity.multiplyScalar(speed);
        }
    }

    public update(_: World, dt: number) {
        this.geometry.verticesNeedUpdate = true;

        const particles = this.geometry.vertices as Particle[];
        const velocity = new Vector3();
        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];
            if (particle.y < -256) continue;

            particle.velocity.y -= GRAVITY * dt;
            particle.velocity.x *= 0.95;
            particle.velocity.z *= 0.95;
            velocity.copy(particle.velocity);
            velocity.multiplyScalar(dt);
            particle.add(velocity);
        }
    }
}
