import { System } from "../../ecs";
import { GameClient } from "../../GameClient";
import { LocalAvatarArchetype } from "../../ecs/Archetypes";
import {
    Mesh,
    Scene,
    MeshBasicMaterial,
    CircleGeometry,
    Vector2,
    Object3D,
    AdditiveBlending,
} from "three";
import { getAngleV2 } from "../../Helpers";

export class HitIndicatorSystem extends System {
    private readonly origin: Object3D;
    private readonly traingle: Mesh;
    private readonly avatars = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public constructor(client: GameClient, layer: Scene) {
        super(client);

        const geo = new CircleGeometry(32, 3, Math.PI + Math.PI / 6);
        const mat = new MeshBasicMaterial({
            color: 0xda2211,
            transparent: true,
            blending: AdditiveBlending,
            opacity: 1,
        });
        this.traingle = new Mesh(geo, mat);
        this.traingle.position.y += 128;

        const shadowMat = new MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 1,
        });
        const shadow = new Mesh(geo, shadowMat);
        shadow.position.z -= 4;
        this.traingle.add(shadow);

        this.origin = new Object3D();
        this.origin.position.z = -256;
        this.origin.rotation.set(0, 0, 0, "XZY");

        this.origin.add(this.traingle);
        layer.add(this.origin);
    }

    public update() {
        const avatar = this.avatars.first();
        if (avatar === undefined) return;

        const duration = 2;
        const delta = this.world.elapsedTime - avatar.hitIndicator.time;
        const alpha = Math.max(duration - delta, 0) / duration;
        if (alpha < 0.01 || !avatar.hitIndicator.show) {
            this.origin.visible = false;
            return;
        }

        const pa = new Vector2(avatar.position.z, avatar.position.x);
        const po = new Vector2(
            avatar.hitIndicator.origin.z,
            avatar.hitIndicator.origin.x
        );

        this.traingle.traverse((obj) => {
            const mesh = obj as Mesh;
            const mat = mesh.material as MeshBasicMaterial;
            mat.opacity = alpha;
            mat.needsUpdate = true;
        });

        this.origin.visible = true;
        this.origin.rotation.z = getAngleV2(po, pa) - avatar.rotation.y;
        this.origin.rotation.x = -Math.PI * 0.4;
        if (avatar.rotation.x < 0) {
            this.origin.rotation.x -= avatar.rotation.x;
        }
    }
}
