<script setup lang="ts">
import { ref, onMounted } from "vue";
import { NaviColumn } from './index'
import { useMimei, useLeither } from "../stores/lapi"

const api = useLeither();
const mmInfo = useMimei();
const contentColumn = ref<ContentColumn[]>([])
onMounted(async ()=>{
  document.title = import.meta.env.VITE_PAGE_TITLE
  try {
      contentColumn.value = mmInfo.naviColumnTree
      var dbMMVer = await api.client.Getvar(api.sid, "mmversions", import.meta.env.VITE_MIMEI_DB)
      console.warn("main.ts built....on " + __BUILD_TIME__, "ver:"+import.meta.env.VITE_APP_VERSION, dbMMVer)
      console.log("main page mounted", mmInfo.$state, api.$state)
  } catch(e) {
      console.error(e)
      api.logout({name: "main"});
  }
})
</script>

<template>
    <div class="container">
        <div class="col-2">
            <ul class="top">
                <NaviColumn v-for="(c, i) in contentColumn" :key="i" :column=c></NaviColumn>
            </ul>
        </div>
        <div class="col-10"></div>
    </div>
</template>

<style>
ul.top {
  list-style-type: none;
  overflow: hidden;
  margin: 0px 0px 0px -20px;
  width: 200px;
}
ul.top li {
  margin: 10px 0px 0px 0px;
}
ul.top li a {
  display: inline-block;
  width: 200px;
  background-color:rgb(220, 247, 202);
}
ul.top li a::before {
  content:"• ";
}
</style>