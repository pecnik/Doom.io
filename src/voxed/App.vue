<style scoped lang="scss">
#voxed-app {
    width: 100vw;
    height: 100vh;
    display: grid;
    grid-template-rows: 96px minmax(0, 1fr);
    grid-template-columns: minmax(0, 1fr);
    box-sizing: border-box;

    #voxed-header {
        grid-row: 1;
    }

    #voxed-viewport {
        grid-row: 2;
    }
}
</style>
<template>
    <v-app>
        <div id="voxed-app">
            <div id="voxed-header" ref="header"></div>
            <div id="voxed-viewport" ref="viewport"></div>
        </div>
    </v-app>
</template>
<script>
import { Editor } from "./Editor";

const editor = Editor.getInstance();

export default {
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
        }
    },
    mounted() {
        const viewport = this.$refs["viewport"];
        editor.renderer.setClearColor(0x4d5c69);
        viewport.appendChild(editor.renderer.domElement);

        this.resize();
        window.addEventListener("resize", this.resize);

        editor.preload().then(() => {
            editor.newLevel(6, 2, 4);
            requestAnimationFrame(function next(elapsed) {
                editor.update(elapsed);
                requestAnimationFrame(next);
            });
        });
    }
};
</script>