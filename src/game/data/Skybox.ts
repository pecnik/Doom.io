import { loadTexture } from "../Helpers";
import { MeshBasicMaterial, BackSide, BoxGeometry, Mesh } from "three";
import { degToRad } from "../core/Utils";

export function createSkybox() {
    const loadMaterial = (src: string) => {
        return loadTexture(src).then((map) => {
            return new MeshBasicMaterial({ map, side: BackSide });
        });
    };

    return Promise.all([
        loadMaterial("/assets/skybox/hell_ft.png"),
        loadMaterial("/assets/skybox/hell_bk.png"),

        loadMaterial("/assets/skybox/hell_up.png"),
        loadMaterial("/assets/skybox/hell_dn.png"),

        loadMaterial("/assets/skybox/hell_rt.png"),
        loadMaterial("/assets/skybox/hell_lf.png"),
    ]).then((materials) => {
        const geometry = new BoxGeometry(512, 512, 512);
        geometry.rotateY(degToRad(45));
        const skyBox = new Mesh(geometry, materials);
        return skyBox;
    });
}
