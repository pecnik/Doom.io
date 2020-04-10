import { Texture, TextureLoader, NearestFilter, Mesh, Material } from "three";

export function loadTexture(src: string): Promise<Texture> {
    return new Promise(resolve => {
        new TextureLoader().load(src, map => {
            map.minFilter = NearestFilter;
            map.magFilter = NearestFilter;
            resolve(map);
        });
    });
}

export function disposeMeshMaterial(mesh: Mesh) {
    if (mesh.material instanceof Material) {
        mesh.material.dispose();
    } else {
        mesh.material.forEach(material => material.dispose());
    }
}
