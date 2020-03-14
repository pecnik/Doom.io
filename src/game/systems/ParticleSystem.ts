import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../data/World";
import { random } from "lodash";
import {
    ParticleEmitterComponent,
    PositionComponent
} from "../data/Components";
import {
    Geometry,
    PointsMaterial,
    Vector3,
    Points,
    Color,
    VertexColors
} from "three";
import { GRAVITY } from "../data/Globals";

class Particle extends Vector3 {
    public readonly velocity = new Vector3();
}

export class ParticleSystem extends System {
    private readonly family: Family;
    private readonly particles: Geometry;

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world)
            .include(ParticleEmitterComponent)
            .include(PositionComponent)
            .build();

        // create the particle variables
        const material = new PointsMaterial({
            vertexColors: VertexColors,
            size: 1 / 24
        });
        this.particles = new Geometry();
        for (let p = 0; p < 1024; p++) {
            this.particles.vertices.push(new Particle(0, -2, 0));
            this.particles.colors.push(new Color(1, 0, 1));
        }

        const particles = new Points(this.particles, material);
        particles.frustumCulled = false;
        world.scene.add(particles);
    }

    private getFreeParticleIndex(): number {
        for (let i = 0; i < this.particles.vertices.length; i++) {
            const particle = this.particles.vertices[i] as Particle;
            if (particle.y >= 1 || particle.y <= -1) {
                return i;
            }
        }
        return -1;
    }

    public update(world: World, dt: number) {
        this.updateEmitters(world);
        this.updateParticles(dt);
    }

    private updateEmitters(world: World) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const emitter = entity.getComponent(ParticleEmitterComponent);

            if (emitter.count >= emitter.times) {
                continue;
            }

            if (world.elapsedTime - emitter.emitTime > emitter.interval) {
                emitter.emitTime = world.elapsedTime;
                emitter.count++;

                for (let i = 0; i < emitter.particles; i++) {
                    const index = this.getFreeParticleIndex();
                    if (index === -1) continue;

                    // Update particle
                    const particle = this.particles.vertices[index] as Particle;
                    const position = entity.getComponent(PositionComponent);
                    particle.set(position.x, position.y, position.z);

                    // Set particle color
                    const color = this.particles.colors[index];
                    const target = emitter.color.clone();
                    const cell = world.level.getCellAt(position);
                    if (cell !== undefined) {
                        target.multiply(cell.light);
                    }
                    if (!color.equals(target)) {
                        color.copy(target);
                        this.particles.colorsNeedUpdate = true;
                    }

                    const rand = 0.5;
                    particle.velocity.copy(emitter.direction);
                    particle.velocity.x += random(-rand, rand, true);
                    particle.velocity.y += random(-rand, rand, true);
                    particle.velocity.z += random(-rand, rand, true);

                    particle.velocity.normalize();
                    particle.velocity.multiplyScalar(random(0.025, 0.05, true));
                }
            }
        }
    }

    private updateParticles(dt: number) {
        this.particles.verticesNeedUpdate = false;
        for (let i = 0; i < this.particles.vertices.length; i++) {
            const particle = this.particles.vertices[i] as Particle;
            if (particle.y < -1) continue;

            // Update velocity and position
            particle.velocity.x *= 0.9;
            particle.velocity.z *= 0.9;
            particle.velocity.y -= GRAVITY * dt * 0.01;
            particle.add(particle.velocity);

            // Bounce of floor
            if (particle.y <= -0.5) {
                particle.y = -0.5;
                particle.velocity.y *= -random(0.25, 0.5, true);
                if (particle.velocity.y < 0.001) {
                    particle.y = -1000;
                }
            }

            this.particles.verticesNeedUpdate = true;
        }
    }
}
