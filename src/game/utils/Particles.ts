import {
    Vector3,
    Geometry,
    PointsMaterial,
    VertexColors,
    Color,
    Points,
} from "three";
import { random } from "lodash";
import { GRAVITY } from "../data/Globals";
import { World } from "../data/World";
import { VoxelType } from "../../editor/Level";

export class Particle extends Vector3 {
    public readonly velocity = new Vector3();
}

export class Particles {
    public readonly scene: Points;
    public readonly particles: Geometry;

    public constructor() {
        // create the particle variables
        const material = new PointsMaterial({
            vertexColors: VertexColors,
            size: 1 / 24, // TODO - resize based on camera FOV
        });

        this.particles = new Geometry();
        for (let p = 0; p < 1024; p++) {
            this.particles.vertices.push(new Particle(0, -2, 0));
            this.particles.colors.push(new Color(1, 0, 1));
        }

        this.scene = new Points(this.particles, material);
        this.scene.frustumCulled = false;
    }

    private getFreeParticleIndex(): number {
        for (let i = 0; i < this.particles.vertices.length; i++) {
            const particle = this.particles.vertices[i] as Particle;
            if (particle.y < -1) {
                return i;
            }
        }
        return -1;
    }

    public emit(
        position: Vector3,
        direction: Vector3,
        color: Color,
        count = 3
    ) {
        for (let i = 0; i < count; i++) {
            const index = this.getFreeParticleIndex();
            if (index === -1) continue;

            // Update particle
            const particle = this.particles.vertices[index] as Particle;
            particle.set(position.x, position.y, position.z);

            // Set particle color
            // TODO - handle level cell light
            const particleColor = this.particles.colors[index];
            if (!particleColor.equals(color)) {
                particleColor.copy(color);
                this.particles.colorsNeedUpdate = true;
            }

            const rand = 0.5;
            particle.velocity.copy(direction);
            particle.velocity.x += random(-rand, rand, true);
            particle.velocity.y += random(-rand, rand, true);
            particle.velocity.z += random(-rand, rand, true);

            particle.velocity.normalize();
            particle.velocity.multiplyScalar(random(0.025, 0.05, true));
        }
    }

    public update(world: World, dt: number) {
        this.particles.verticesNeedUpdate = false;
        for (let i = 0; i < this.particles.vertices.length; i++) {
            const particle = this.particles.vertices[i] as Particle;
            if (particle.y < -1) continue;

            // Update velocity and position
            particle.velocity.x *= 0.9;
            particle.velocity.z *= 0.9;
            particle.velocity.y -= GRAVITY * dt * 0.002;
            particle.add(particle.velocity);

            // Bounce of floor
            const voxel = world.level.getVoxelAt(particle);
            if (voxel !== undefined && voxel.type === VoxelType.Solid) {
                const floor = voxel.y + 0.5;
                if (particle.y <= floor) {
                    particle.y = floor;
                    particle.velocity.y *= -random(0.25, 0.5, true);
                    if (particle.velocity.y < 0.001) {
                        particle.y = -1000;
                    }
                }
            }

            this.particles.verticesNeedUpdate = true;
        }
    }
}
