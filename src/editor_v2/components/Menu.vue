<template>
    <div class="menu">
        <div class="tool-list">
            <v-btn v-for="tool in tools"
                :key="tool.key"
                :color="tool.active ? 'teal' : ''"
                :title="tool.name"
                @click="setTool(tool.type)"
                class="mb-2"
                block
                small
                >
                {{ tool.hotkey }}
            </v-btn>
        </div>
        <div class="tool-options" v-if="activeTool">
            <v-card>
                <v-card-title>{{ activeTool.name }}</v-card-title>
                <v-card-text>
                    <div v-if="activeTool.type === ToolType.Move">
                        <pre>{{ $store.state.cursor }}</pre>
                    </div>
                    <div v-if="activeTool.type === ToolType.Block">
                        <v-slider
                            label="Brush size"
                            v-model="$store.state.block.brushSize"
                            min="1"
                            max="8"
                            step="1"
                            thumb-label
                        ></v-slider>
                        <texture-input v-model="$store.state.block.tileId"></texture-input>
                    </div>
                    <div v-if="activeTool.type === ToolType.Eraser">
                        <v-slider
                            label="Brush size"
                            v-model="$store.state.eraser.brushSize"
                            min="1"
                            max="8"
                            step="1"
                            thumb-label
                        ></v-slider>
                    </div>
                    <div v-if="activeTool.type === ToolType.Paint">
                        <texture-input v-model="$store.state.paint.tileId"></texture-input>
                    </div>
                </v-card-text>
            </v-card>
        </div>
    </div>
</template>
<script>
import TextureInput from "./TextureInput.vue";
import { ToolType } from "../tools/Tool";
import { KeyCode } from "../../game/core/Input";
import { editor } from "../Editor";
import { map, cloneDeep } from "lodash";
export default {
    components: { TextureInput },
    computed: {
        tools() {
            const type = this.$store.state.defaultToolType;
            return map(editor.tools, (tool, index) => {
                return {
                    key: `t-${index}`,
                    type: tool.type,
                    name: tool.name,
                    hotkey: KeyCode[tool.hotkey],
                    active: type === tool.type
                };
            });
        },
        activeTool() {
            return this.tools.find(t => t.active);
        }
    },
    methods: {
        setTool(toolType) {
            editor.store.state.defaultToolType = toolType;
        }
    },
    data() {
        return {
            ToolType: cloneDeep(ToolType)
        };
    }
};
</script>
<style scoped lang="scss">
.menu {
    display: flex;
    .tool-list {
        width: 64px;
        margin-right: 8px;
    }

    .tool-options {
        width: 100%;
    }
}
</style>
