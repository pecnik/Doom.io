<template>
    <div id="app">
        <div id="cursor">
            <i class="fa" :class="toolIcon"></i>
        </div>
        <div id="menu-left" class="panel">
            <tile-bar></tile-bar>
        </div>
        <div id="menu-right" class="panel">
            <button class="form-cotnrol" @click="play">PLAY</button>
            <label>
                <select class="form-cotnrol" :value="$store.state.tool" @input="setTool">
                    <option v-for="tool in tools" :key="tool.value" :value="tool.value">
                        {{ tool.label }}
                    </option>
                </select>
            </label>
            <label class="form-cotnrol">
                <input type="checkbox"
                    :checked="$store.state.wireframe"
                    @change="toggleWireframe">
                Wireframe
            </label>
            <label class="form-cotnrol">
                <input type="checkbox"
                    :checked="$store.state.debugLights"
                    @change="toggleDebugLights">
                Debug lights
            </label>
        </div>
        <div id="dialog" v-if="tileSelectDialog">
            <tile-select-dialog></tile-select-dialog>
        </div>
    </div>
</template>
<script>
import TileBar from "./TileBar.vue";
import TileSelectDialog from "./TileSelectDialog.vue";
import { EditorTool } from "../store/EditorState";
export default {
    components: { TileBar, TileSelectDialog },
    computed: {
        tileSelectDialog() {
            return this.$store.state.tileSelectDialog;
        },
        toolIcon() {
            return this.$store.state.tool;
        }
    },
    methods: {
        toggleWireframe(ev) {
            this.$store.dispatch("setWireframe", ev.target.checked);
        },
        toggleDebugLights(ev) {
            this.$store.dispatch("setDebugLights", ev.target.checked);
        },
        setTool(ev) {
            this.$store.dispatch("setTool", ev.target.value);
        },
        play() {
            const { level } = this.$store.state;
            localStorage.setItem("level", JSON.stringify(level));

            const url = [location.origin, location.pathname].join("");
            window.open(url);
        }
    },
    data() {
        const tools = [
            {
                value: EditorTool.Block,
                label: "Block (E)"
            },
            {
                value: EditorTool.Paint,
                label: "Fill (F)"
            },
            {
                value: EditorTool.Pick,
                label: "Sample (ALT)"
            }
        ];

        return { tools };
    }
};
</script>
<style lang="scss">
#app {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 16px;

    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;

    display: grid;
    grid-template-rows: 40px 1fr 96px;
    grid-template-columns: 192px 1fr 192px;

    pointer-events: none;

    #cursor {
        $cursor_size: 32px;
        pointer-events: none;
        position: absolute;

        top: 50vh;
        left: 50vw;
        width: $cursor_size;
        height: $cursor_size;
        margin-top: -$cursor_size / 2;
        margin-left: -$cursor_size / 2;
        border-radius: $cursor_size / 2;

        opacity: 0.5;
        color: #000;
        background: #fff;

        text-align: center;
        font-size: $cursor_size / 2;
        line-height: $cursor_size;
    }

    #dialog > *,
    #menu-top,
    #menu-bot,
    #menu-left,
    #menu-right {
        pointer-events: auto;
    }

    #dialog {
        padding: 32px;
        grid-row-start: 1;
        grid-row-end: 4;
        grid-column-start: 2;
        grid-column-end: 3;
    }

    #menu-top {
        grid-row: 1;
        grid-column-start: 2;
        grid-column-end: 3;
    }

    #menu-bot {
        grid-row: 3;
        grid-column-start: 2;
        grid-column-end: 3;
    }

    #menu-left {
        grid-column: 1;
        grid-row-start: 1;
        grid-row-end: 4;
    }

    #menu-right {
        grid-column: 3;
        grid-row-start: 1;
        grid-row-end: 4;
    }
}

.panel {
    padding: 16px;
    color: #f2f2f2;
    background: #222;
}

.form-cotnrol {
    display: block;
    line-height: 32px;
    height: 32px;
    padding: 0;
    width: 100%;
    margin-bottom: 16px;
    opacity: 0.75;
    user-select: none;

    &:hover {
        opacity: 1;
        cursor: pointer;
    }
}
</style>