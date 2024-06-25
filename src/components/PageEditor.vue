<script setup lang="ts">
import { ref, onMounted } from "vue";
import { NaviColumn, EditorModal } from './index'
import { useMimei, useLeither } from "../stores/lapi"

const api = useLeither();
const mmInfo = useMimei();
const contentColumn = ref<ContentColumn[]>([])
const columnTitle = ref("Pictures")

onMounted(async () => {
    document.title = import.meta.env.VITE_PAGE_TITLE
    try {
        contentColumn.value = mmInfo.naviColumnTree
        var dbMMVer = await api.client.Getvar(api.sid, "mmversions", import.meta.env.VITE_MIMEI_DB)
        console.warn("main.ts built....on " + __BUILD_TIME__, "ver:" + import.meta.env.VITE_APP_VERSION, dbMMVer)
        console.log("main page mounted", mmInfo.$state, api.$state)
    } catch (e) {
        console.error(e)
        // api.logout({ name: "main" });
    }
})
</script>

<template>
    <div class='container-fluid'>
        <div class='row'>
            <div class='col-2'>
                <NaviColumn @selected-column="id => columnTitle = id" v-for='(c, i) in contentColumn' :key='i' :column=c>
                </NaviColumn>
            </div>
            <div class='col-10'>
                <!-- <QuillEditor :column='columnTitle'></QuillEditor> -->
                <EditorModal :column='columnTitle'></EditorModal>
            </div>
        </div>
    </div>
</template>

<style scoped>
.container-fluid {
    height: 100vh;
    /* Ensure the container takes the full height of the viewport */
}

.row {
    display: flex;
    align-items: flex-start;
    /* Align items to the top */
    height: 100%;
    /* Ensure the row takes the full height of the container */
}

.col-2 {
    width: 160px;
}

.col-10 {
    margin: -0px 0 0 0;
    /* Remove any margin that might affect alignment */
    width: 80%;
    padding: 0;
    /* Remove any padding that might affect alignment */
    display: flex;
    flex-direction: column;
    /* Ensure the content inside col-10 is aligned to the top */
}
</style>