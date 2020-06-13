<template>
    <span>
        <v-menu offset-y min-width="200px">
            <template v-slot:activator="{ on }">
                <v-btn color="teal" small v-on="on">
                    Edit
                </v-btn>
            </template>
            <v-list>
                <v-list-item
                    v-for="(option, key) in options"
                    :key="key + 1"
                    @click="option.click"
                >
                    <v-list-item-title>
                        {{ option.label }}
                    </v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>

        <dialog-resize v-model="resizeDialog"></dialog-resize>
        <dialog-retexture v-model="retextureDialog"></dialog-retexture>
    </span>
</template>
<script>
import DialogResize from "./SidemenuEditDialogResize.vue";
import DialogRetexture from "./SidemenuEditDialogRetexture.vue";
import { editor } from "../Editor";
export default {
    components: { DialogRetexture, DialogResize },
    data() {
        return {
            resizeDialog: false,
            retextureDialog: false,
            options: [
                {
                    label: "Resize",
                    click: () => {
                        this.resizeDialog = true;
                    }
                },
                {
                    label: "Re-texture level",
                    click: () => {
                        this.retextureDialog = true;
                    }
                },
                {
                    label: "Symmetrize X",
                    click: () => {
                        editor.commitLevelMutation(level => {
                            const mid = Math.floor(level.width / 2);
                            level.blocks.forEach(block => {
                                const mirror = level.getBlock(
                                    block.origin.x < mid
                                        ? block.origin.x
                                        : level.width - block.origin.x - 1,
                                    block.origin.y,
                                    block.origin.z
                                );
                                block.copy(mirror);
                            });
                        });
                    }
                },
                {
                    label: "Symmetrize Z",
                    click: () => {
                        editor.commitLevelMutation(level => {
                            const mid = Math.floor(level.depth / 2);
                            level.blocks.forEach(block => {
                                const mirror = level.getBlock(
                                    block.origin.x,
                                    block.origin.y,
                                    block.origin.z < mid
                                        ? block.origin.z
                                        : level.depth - block.origin.z - 1
                                );
                                block.copy(mirror);
                            });
                        });
                    }
                }
            ]
        };
    }
};
</script>
