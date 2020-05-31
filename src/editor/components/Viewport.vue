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

    &.tool-cursor-move {
        cursor: move;
    }

    &.tool-cursor-paint {
        cursor: url("../assets/icon-fill.png"), auto;
    }

    &.tool-cursor-block {
        cursor: url("../assets/icon-block.png"), auto;
    }

    &.tool-cursor-eraser {
        cursor: url("../assets/icon-eraser.png"), auto;
    }

    &.tool-cursor-select {
        cursor: url("../assets/icon-select.png"), auto;
    }

    &.tool-cursor-eyedropper {
        cursor: url("../assets/icon-eyedropper.png"), auto;
    }
}
</style>