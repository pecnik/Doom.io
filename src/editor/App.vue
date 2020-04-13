<template>
    <v-app>
        <div id="voxed-app">
            <div id="voxed-viewport" ref="viewport"></div>
            <div id="voxed-viewport-cursor">
                <div class="cursor"></div>
            </div>
            <div id="voxed-sidemenu" ref="sidemenu">
                <v-btn class="mb-4" x-large block color="teal" @click="play">PLAY</v-btn>
                <sidemenu></sidemenu>
            </div>
        </div>
    </v-app>
</template>
<script>
import Sidemenu from "./components/Sidemenu.vue";
import { editor } from "./Editor";

export default {
    components: { Sidemenu },
    methods: {
        resize() {
            const viewport = this.$refs["viewport"];
            const width = Math.floor(viewport.offsetWidth - 1);
            const height = Math.floor(viewport.offsetHeight - 1);
            const aspect = width / height;
            editor.camera.aspect = aspect;
            editor.camera.near = 0.1;
            editor.camera.far = 1000;
            editor.camera.updateProjectionMatrix();
            editor.renderer.setSize(width, height);
        },
        play() {
            const json = JSON.stringify(editor.level.data);
            localStorage.setItem("level", json);

            const url = [location.origin, location.pathname].join("");
            window.open(url);
        }
    },
    mounted() {
        const viewport = this.$refs["viewport"];
        editor.renderer.setClearColor(0x4d5c69);
        viewport.appendChild(editor.renderer.domElement);

        this.resize();
        window.addEventListener("resize", this.resize);

        editor.preload().then(() => {
            const json = localStorage.getItem("level");
            if (json !== null) {
                editor.level.data = JSON.parse(json);
                editor.level.updateGeometry();
            }

            setInterval(() => {
                const json = JSON.stringify(editor.level.data);
                localStorage.setItem("level", json);
            }, 5000);

            requestAnimationFrame(function next(elapsed) {
                editor.update(elapsed);
                requestAnimationFrame(next);
            });
        });
    }
};
</script>
<style scoped lang="scss">
#voxed-app {
    width: 100vw;
    height: 100vh;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: minmax(0, 1fr) 400px;
    box-sizing: border-box;

    #voxed-sidemenu {
        grid-row: 1;
        grid-column: 2;
        padding: 16px;
        overflow-y: auto;
    }

    #voxed-viewport {
        z-index: 1;
        grid-row: 1;
        grid-column: 1;
    }

    #voxed-viewport-cursor {
        z-index: 2;
        grid-row: 1;
        grid-column: 1;
        pointer-events: none;

        display: grid;
        align-content: space-evenly;
        justify-content: space-evenly;

        .cursor {
            $cursor_size: 8px;
            border: 1px solid black;
            background-color: white;
            width: $cursor_size;
            height: $cursor_size;
            border-radius: $cursor_size / 2;
            opacity: 0.5;
        }
    }
}
</style>
