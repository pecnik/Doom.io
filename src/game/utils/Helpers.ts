import { Texture, TextureLoader, NearestFilter } from "three";

export function loadTexture(src: string): Promise<Texture> {
    return new Promise((resolve) => {
        new TextureLoader().load(src, (map) => {
            map.minFilter = NearestFilter;
            map.magFilter = NearestFilter;
            resolve(map);
        });
    });
}
