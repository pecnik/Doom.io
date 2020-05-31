<template>
    <div ref="viewport" class="viewport" :class="cursorCssClass" @mousemove="mousemove"></div>
</template>
<script>
import { editor } from "../Editor";

export default {
    computed: {
        cursorCssClass() {
            return this.$store.state.cursorType;
        }
    },
    methods: {
        resize() {
            const viewport = this.$refs["viewport"];
            const width = Math.floor(viewport.offsetWidth - 1);
            const height = Math.floor(viewport.offsetHeight - 1);
            const aspect = width / height;
            editor.camera.aspect = aspect;
            editor.camera.near = 0.1;
            editor.camera.far = 512;
            editor.camera.updateProjectionMatrix();
            editor.renderer.setSize(width, height);
        },
        mousemove(ev) {
            const viewport = this.$refs["viewport"];
            const width = Math.floor(viewport.offsetWidth - 1);
            const height = Math.floor(viewport.offsetHeight - 1);
            editor.store.state.cursor.x = ev.layerX / width - 0.5;
            editor.store.state.cursor.y = -(ev.layerY / height - 0.5);

            editor.store.state.cursor.x *= 2;
            editor.store.state.cursor.y *= 2;
        }
    },
    mounted() {
        // Init editor
        const viewport = this.$refs["viewport"];
        editor.renderer.setClearColor(0x4d5c69);
        viewport.appendChild(editor.renderer.domElement);

        this.resize();
        window.addEventListener("resize", this.resize);

        requestAnimationFrame(function next() {
            editor.update();
            requestAnimationFrame(next);
        });
    }
};
</script>
<style scoped lang="scss">
.viewport {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    cursor: crosshair;

    &.cursor-tool-move {
        cursor: move;
    }

    &.cursor-tool-paint {
        cursor: url("../assets/icon-fill.png"), auto;
    }

    &.cursor-tool-block {
        cursor: url("../assets/icon-block.png"), auto;
    }

    &.cursor-tool-eraser {
        cursor: url("../assets/icon-eraser.png"), auto;
    }

    &.cursor-tool-select {
        cursor: url("../assets/icon-select.png"), auto;
    }
}
</style>