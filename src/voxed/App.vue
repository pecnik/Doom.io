<style scoped lang="scss">
#voxed-app {
    width: 100vw;
    height: 100vh;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    grid-template-columns: minmax(0, 1fr) 300px;
    box-sizing: border-box;

    #voxed-sidemenu {
        grid-row: 1;
        grid-column: 2;
        padding: 16px;
    }

    #voxed-viewport {
        grid-row: 1;
        grid-column: 1;
    }

    #voxed-viewport-cursor {
        grid-row: 1;
        grid-column: 1;
        pointer-events: none;

        /* center fa curosr */
        display: grid;
        align-content: space-evenly;
        justify-content: space-evenly;

        .fa {
            $cursor_size: 24px;
            pointer-events: none;
            width: $cursor_size;
            height: $cursor_size;
            border-radius: $cursor_size / 2;

            opacity: 0.75;
            color: #000;
            background: #fff;

            text-align: center;
            font-size: $cursor_size / 2;
            line-height: $cursor_size;
        }
    }
}
</style>
<template>
    <v-app>
        <div id="voxed-app">

            <!-- Viewport -->
            <div id="voxed-viewport" ref="viewport"></div>
            <div id="voxed-viewport-cursor">
                <i class="fa" :class="toolIcon"></i>
            </div>

            <!-- Side menu -->
            <div id="voxed-sidemenu" ref="sidemenu">
                <v-btn x-large block @click="play">PLAY</v-btn>
                <br>
                <br>

                <v-card class="mb-4">
                    <v-card-text>
                        <tool-select></tool-select>
                    </v-card-text>
                    <v-card-text>
                        <render-settings></render-settings>
                    </v-card-text>
                </v-card>
                <texture-select></texture-select>
            </div>
        </div>
    </v-app>
</template>
<script>
import DefaultLevel from "../../assets/levels/level_one.json";
import ToolSelect from "./components/ToolSelect.vue";
import TextureSelect from "./components/TextureSelect.vue";
import RenderSettings from "./components/RenderSettings.vue";
import { Editor } from "./Editor";

const editor = Editor.getInstance();

export default {
    components: { ToolSelect, RenderSettings, TextureSelect },
    computed: {
        toolIcon() {
            const { toolId } = this.$store.state;
            return editor.toolMap[toolId].faicon;
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
            } else {
                editor.level.data = DefaultLevel;
                editor.level.updateGeometry();
            }

            requestAnimationFrame(function next(elapsed) {
                editor.update(elapsed);
                requestAnimationFrame(next);
            });
        });
    }
};
</script>