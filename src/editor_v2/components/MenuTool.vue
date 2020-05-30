<template>
    <div class="tools">
        <div class="mb-2">
            <v-radio-group v-model="$store.state.defaultTool">
                <v-radio label="Block (B)" value="block"></v-radio>
                <v-radio label="Paint (F)" value="paint"></v-radio>
                <v-radio label="Block properties (G)" value="select"></v-radio>
            </v-radio-group>
        </div>

        <v-card class="mb-2" v-if="showTexture">
            <v-card-title>Texture</v-card-title>
            <v-card-text>
                <texture-input v-model="$store.state.tileId"></texture-input>
            </v-card-text>
        </v-card>

        <v-card class="mb-2" v-if="showBlockProps">
            <v-card-title>Block props</v-card-title>
            <v-card-text>
                <v-checkbox v-model="block.solid" @change="writeBlock" label="Solid"></v-checkbox>
                <v-checkbox v-model="block.emit" @change="writeBlock" label="Emit light"></v-checkbox>
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
            const { defaultTool } = this.$store.state;
            return defaultTool === "block" || defaultTool === "paint";
        },
        showBlockProps() {
            const { defaultTool } = this.$store.state;
            return this.block.index > -1 && defaultTool === "select";
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
            this.block.emit = block.emit;
            this.block.solid = block.solid;
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
            }

            if (block !== undefined) {
                editor.commitLevelMutation(() => {
                    block.solid = this.block.solid;
                    block.emit = this.block.emit;
                    block.jumpPadForce = this.block.jumpPad
                        ? this.block.jumpPadForce
                        : 0;
                });
            }
        }
    },
    data() {
        return {
            block: {
                index: -1,
                emit: false,
                solid: false,
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