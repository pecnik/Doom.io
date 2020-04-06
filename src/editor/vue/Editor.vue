<template>
    <div>
        <v-app>
        <div id="editor-app">
            <div id="editor-header">HEADER</div>
            <div id="editor-sidemenu">SIDEMENI</div>
            <div id="editor-viewport" ref="viewport"></div>
        </div>
        </v-app>
    </div>
</template>
<script>
import { WebGLRenderer } from "three";
import { Editor } from "../Editor";
import { debounce } from "lodash";

export default {
    mounted() {
        const viewport = this.$refs["viewport"];
        const renderer = new WebGLRenderer({});
        viewport.appendChild(renderer.domElement);

        const editor = new Editor(renderer.domElement);

        let aspect = 0;
        const onWindowResize = debounce(() => {
            const width = viewport.offsetWidth;
            const height = viewport.offsetHeight;
            const aspect = width / height;
            const camera = editor.world.camera;
            camera.aspect = aspect;
            camera.near = 0.1;
            camera.far = 1000;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }, 250);

        window.addEventListener("resize", onWindowResize);
        onWindowResize();

        editor.preload().then(() => {
            editor.create(); // Start game

            let lastTime = 0;
            requestAnimationFrame(function next(gameTime) {
                const delta = (gameTime - lastTime) * 0.001;
                lastTime = gameTime;
                editor.update(delta);
                renderer.render(editor.world.scene, editor.world.camera);
                requestAnimationFrame(next);
            });
        });
    }
};
</script>
<style lang="scss">
#editor-app {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    box-sizing: border-box;

    display: grid;
    grid-template-rows: 96px minmax(0, 1fr);
    grid-template-columns: 250px minmax(0, 1fr);

    #editor-header {
        box-sizing: border-box;
        grid-row: 1;
        grid-column-start: 1;
        grid-column-end: 3;
    }

    #editor-sidemenu {
        box-sizing: border-box;
        grid-row: 2;
        grid-column: 1;
    }

    #editor-viewport {
        box-sizing: border-box;
        grid-row: 2;
        grid-column: 2;
    }
}
</style>