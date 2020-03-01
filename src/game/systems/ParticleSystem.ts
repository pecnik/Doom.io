import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../World";
import { random } from "lodash";
import { ParticleEmitterComponent, PositionComponent } from "../Components";
import { Geometry, PointsMaterial, Vector3, Points } from "three";
import { GRAVITY } from "../Globals";

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
            color: 0x000000,
            size: 1 / 32
        });
        this.particles = new Geometry();
        for (let p = 0; p < 32; p++) {
            this.particles.vertices.push(new Particle(0, -2, 0));
        }

        const particles = new Points(this.particles, material);
        particles.frustumCulled = false;
        world.scene.add(particles);
    }

    private getFreeParticle() {
        for (let i = 0; i < this.particles.vertices.length; i++) {
            const particle = this.particles.vertices[i] as Particle;
            if (particle.y >= 1 || particle.y <= -1) {
                return particle;
            }
        }
        return;
    }

    public update(world: World, dt: number) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const emitter = entity.getComponent(ParticleEmitterComponent);

            if (emitter.count >= emitter.times) {
                continue;
            }

            if (world.elapsedTime - emitter.emitTime > emitter.interval) {
                emitter.emitTime = world.elapsedTime;
                emitter.count++;

                for (let i = 0; i < 3; i++) {
                    const particle = this.getFreeParticle();
                    if (particle === undefined) continue;

                    const position = entity.getComponent(PositionComponent);
                    particle.set(position.x, position.y, position.z);

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

        this.particles.verticesNeedUpdate = false;
        for (let i = 0; i < this.particles.vertices.length; i++) {
            const particle = this.particles.vertices[i] as Particle;
            if (particle.y < 1 && particle.y > -1) {
                particle.velocity.x *= 0.9;
                particle.velocity.z *= 0.9;
                particle.velocity.y -= GRAVITY * dt * 0.01;
                particle.add(particle.velocity);

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
}
