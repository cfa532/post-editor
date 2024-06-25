<script setup lang="ts">
import { ref, onMounted } from "vue";
import { NaviColumn, EditorModal } from './index'
import { useMimei, useLeither } from "../stores/lapi"

const api = useLeither();
const mmInfo = useMimei();
const contentColumn = ref<ContentColumn[]>([])
const columnTitle = ref("Funny")

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
    <div class="container">
        <div class="row">
            <div class="col-2">
                <ul class="top">
                    <NaviColumn v-for="(c, i) in contentColumn" :key="i" :column=c></NaviColumn>
                </ul>
            </div>
            <div class="col-10">
                <EditorModal :column="columnTitle"></EditorModal>
            </div>
        </div>
    </div>
</template>

<style scoped>
.container {
  margin-top: 1rem;
}
.col-2, .col-10 {
    display: inline-block;
}
.top {
    width: 160px;
}
</style>