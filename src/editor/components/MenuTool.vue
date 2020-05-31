<template>
    <div class="tools">
        <div class="mb-2">
            <v-radio-group v-model="$store.state.activeTool">
                <v-radio
                    v-for="tool in tools"
                    :key="tool.name"
                    :value="tool.name"
                    :label="tool.label"
                ></v-radio>
            </v-radio-group>
        </div>

        <v-card class="mb-2" v-if="showTexture">
            <v-card-title>Texture</v-card-title>
            <v-card-text>
                <texture-input v-model="$store.state.tileId"></texture-input>
            </v-card-text>
        </v-card>

        <v-card class="mb-2" v-if="showBlockProps" :key="block.index">
            <v-card-title>Block props</v-card-title>
            <v-card-text>
                <v-checkbox v-model="block.solid" @change="writeBlock" label="Solid"></v-checkbox>

                <v-checkbox v-model="block.lightEnabled" @change="writeBlock" label="Emit light"></v-checkbox>
                <div v-if="block.lightEnabled">
                    <v-slider
                        v-model="block.lightStr"
                        min="1"
                        max="10"
                        :step="0.1"
                        label="Strength"
                        :thumb-size="24"
                        thumb-label="always"
                        @change="writeBlock"
                    ></v-slider>
                    <v-slider
                        v-model="block.lightRad"
                        min="1"
                        max="24"
                        label="Radius"
                        :thumb-size="24"
                        thumb-label="always"
                        @change="writeBlock"
                    ></v-slider>
                    <v-color-picker
                        v-model="block.lightHexStr"
                        @input="updateColor"
                    ></v-color-picker>
                </div>

                <v-checkbox v-model="block.jumpPad" @change="writeBlock" label="Jump pad"></v-checkbox>
                <v-slider
                    v-if="block.jumpPad"
                    v-model="block.jumpPadForce"
                    min="0"
                    max="8"
                    label="Jump pad force"
                    :thumb-size="24"
                    thumb-label="always"
                    @change="writeBlock"
                ></v-slider>
                <pre>{{ block }}</pre>
            </v-card-text>
        </v-card>
    </div>
</template>
<script>
import TextureInput from "./TextureInput.vue";
import { editor } from "../Editor";
import { debounce } from "lodash";
import { KeyCode } from "../../game/core/Input";
import { PaintTool } from "../tools/PaintTool";
import { BlockTool } from "../tools/BlockTool";
import { SelecTool } from "../tools/SelectTool";
import { SampleTool } from "../tools/SampleTool";

const toHexStr = color => {
    return "#" + color.getHexString();
};

const toHexInt = str => {
    return parseInt(str.replace("#", ""), 16);
};

const BLOCK_TOOL = editor.tools.get(BlockTool).name;
const PAINT_TOOL = editor.tools.get(PaintTool).name;
const SELECT_TOOL = editor.tools.get(SelecTool).name;
const SAMPLE_TOOL = editor.tools.get(SampleTool).name;

export default {
    components: { TextureInput },
    computed: {
        blockIndex() {
            return this.$store.state.blockIndex;
        },
        levelMutations() {
            return this.$store.state.levelMutations;
        },
        showTexture() {
            const { activeTool } = this.$store.state;
            const tools = [SAMPLE_TOOL, BLOCK_TOOL, PAINT_TOOL];
            return tools.indexOf(activeTool) > -1;
        },
        showBlockProps() {
            const { activeTool } = this.$store.state;
            return this.block.index > -1 && activeTool === SELECT_TOOL;
        }
    },
    watch: {
        blockIndex: "readBlock",
        levelMutations: "readBlock"
    },
    methods: {
        readBlock() {
            const index = this.blockIndex;
            const block = editor.level.blocks[index];
            if (block === undefined) {
                this.block.index = -1;
                return;
            }

            this.block.index = index;
            this.block.solid = block.solid;

            this.block.lightEnabled = block.lightStr > 0;
            this.block.lightHexStr = toHexStr(block.lightColor);
            this.block.lightStr = block.lightStr;
            this.block.lightRad = block.lightRad;

            this.block.jumpPad = block.jumpPadForce > 0;
            this.block.jumpPadForce = block.jumpPadForce;

            this.block.x = block.origin.x;
            this.block.y = block.origin.y;
            this.block.z = block.origin.z;
        },
        writeBlock() {
            const block = editor.level.blocks[this.block.index];

            if (this.block.jumpPad) {
                this.block.jumpPadForce = Math.max(this.block.jumpPadForce, 1);
            } else {
                this.block.jumpPadForce = 0;
            }

            if (this.block.lightEnabled) {
                this.block.lightStr = Math.max(this.block.lightStr, 1);
                this.block.lightRad = Math.max(this.block.lightRad, 4);
            } else {
                this.block.lightStr = 0;
                this.block.lightRad = 0;
            }

            if (block !== undefined) {
                editor.commitLevelMutation(() => {
                    block.solid = this.block.solid;
                    block.jumpPadForce = this.block.jumpPadForce;
                    block.lightStr = this.block.lightStr;
                    block.lightRad = this.block.lightRad;
                    if (block.lightStr > 0) {
                        const hex = toHexInt(this.block.lightHexStr);
                        block.lightColor.setHex(hex);
                    }
                });
            }
        },
        updateColor: debounce(function(lightHexStr) {
            const index = this.blockIndex;
            const block = editor.level.blocks[index];
            if (block === undefined) return;

            const blockHex = block.lightColor.getHex();
            const valueHex = toHexInt(lightHexStr);
            if (blockHex !== valueHex) {
                this.writeBlock();
            }
        }, 250)
    },
    data() {
        return {
            tools: editor.tools.all.map(tool => {
                const hotkey = KeyCode[tool.hotkey];
                return {
                    label: `${tool.name} (${hotkey})`,
                    name: tool.name,
                    hotkey
                };
            }),
            block: {
                index: -1,

                solid: false,

                lightEnabled: false,
                lightStr: 0,
                lightRad: 0,
                lightHexStr: "#000000",

                jumpPad: false,
                jumpPadForce: 0,

                x: 0,
                y: 0,
                z: 0
            }
        };
    }
};
</script>