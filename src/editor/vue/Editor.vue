<template>
    <div>
        <v-app>
            <v-content>
                <v-container>
                    <div ref="viewport"></div>
                </v-container>
            </v-content>
        </v-app>
    </div>
</template>
<script>
import { WebGLRenderer } from "three";
import { Editor } from "../Editor";
export default {
    mounted() {
        const viewport = this.$refs["viewport"];
        const editor = new Editor(viewport);
        const renderer = new WebGLRenderer({});
        viewport.appendChild(renderer.domElement);

        let aspect = 0;
        const onWindowResize = () => {
            const width = window.innerWidth * 0.5;
            const height = window.innerHeight * 0.5;
            const aspect = width / height;
            const camera = editor.world.camera;
            camera.aspect = aspect;
            camera.near = 0.1;
            camera.far = 1000;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        window.addEventListener("resize", onWindowResize);
        onWindowResize();

        editor.preload().then(() => {
            editor.create(); // Start game

            let lastTime = 0;
            requestAnimationFrame(function next(gameTime) {
                const delta = (gameTime - lastTime) * 0.001;
                lastTime=gameTime
                editor.update(delta);
                renderer.render(editor.world.scene, editor.world.camera);
                requestAnimationFrame(next);
            });
        });
    }
};
</script>
