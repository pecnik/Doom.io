<template>
    <div>
        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="reset">
                Restore default
            </v-btn>
            <v-btn @click="save" color="teal">
                Save
            </v-btn>
        </v-card-actions>
        <v-alert
            :value="successAlert"
            transition="slide-x-transition"
            type="success"
            >Saved!</v-alert
        >
    </div>
</template>
<script>
export default {
    props: {
        settings: { type: Object, required: true }
    },
    methods: {
        showSuccess() {
            this.successAlert = true;
            setTimeout(() => {
                this.successAlert = false;
            }, 2000);
        },
        save() {
            this.$emit("save");
            this.showSuccess();
        },
        reset() {
            setTimeout(() => {
                if (confirm("Restore default settings?")) {
                    this.$emit("reset");
                    this.showSuccess();
                }
            }, 250);
        }
    },
    data() {
        return { successAlert: false };
    }
};
</script>