import { Texture, TextureLoader, NearestFilter, Material } from "three";

export function loadTexture(src: string): Promise<Texture> {
    return new Promise(resolve => {
        new TextureLoader().load(src, map => {
            map.minFilter = NearestFilter;
            map.magFilter = NearestFilter;
            resolve(map);
        });
    });
}

export function disposeMeshMaterial(material: Material | Material[]) {
    if (material instanceof Material) {
        material.dispose();
    } else {
        material.forEach(material => material.dispose());
    }
}
