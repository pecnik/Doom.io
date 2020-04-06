<template>
    <div>
        <v-app>
        <div id="editor-app">
            <div id="editor-header">
                <tile-bar></tile-bar>
            </div>
            <div id="editor-sidemenu">SIDEMENI</div>
            <div id="editor-viewport" ref="viewport"></div>
            <div id="editor-cursor">
                <i class="fa" :class="toolIcon"></i>
            </div>
        </div>
        </v-app>
    </div>
</template>
<script>
import { WebGLRenderer } from "three";
import { Editor } from "../Editor";
import { debounce } from "lodash";

import TileBar from "./TileBar.vue";

export default {
    components: { TileBar },
    computed: {
        toolIcon() {
            return this.$store.state.tool;
        }
    },
    mounted() {
        const viewport = this.$refs["viewport"];
        const renderer = new WebGLRenderer({ antialias: true });
        renderer.setClearColor(0x6495ed);
        viewport.appendChild(renderer.domElement);

        const editor = new Editor(renderer.domElement);

        let aspect = 0;
        const onWindowResize = debounce(() => {
            const width = Math.floor(viewport.offsetWidth - 1);
            const height = Math.floor(viewport.offsetHeight - 1);
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
    grid-gap: 24px;
    grid-template-rows: 96px minmax(0, 1fr);
    grid-template-columns: minmax(0, 1fr) 250px;

    #editor-header {
        box-sizing: border-box;
        grid-row: 1;
        grid-column-start: 1;
        grid-column-end: 3;
    }

    #editor-sidemenu {
        box-sizing: border-box;
        grid-row: 2;
        grid-column: 2;
    }

    #editor-viewport {
        box-sizing: border-box;
        grid-row: 2;
        grid-column: 1;

        > canvas {
            border: 1px solid #999999;
        }
    }

    #editor-cursor {
        grid-row: 2;
        grid-column: 1;
        pointer-events: none;

        /* center fa curosr */
        display: grid;
        align-content: space-evenly;
        justify-content: space-evenly;

        .fa {
            $cursor_size: 32px;
            pointer-events: none;
            width: $cursor_size;
            height: $cursor_size;
            border-radius: $cursor_size / 2;

            opacity: 0.5;
            color: #000;
            background: #fff;

            text-align: center;
            font-size: $cursor_size / 2;
            line-height: $cursor_size;
        }
    }
}
</style>