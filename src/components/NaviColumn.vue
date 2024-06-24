<script setup lang="ts">
import { PropType, onMounted } from 'vue';

const props = defineProps({
    column: {type: Object as PropType<NaviColumn>, required: true },
})

onMounted(()=>{
    // console.log("Column mounted", props)
})
</script>

<template>
    <li>
        <RouterLink v-if="!column.subColumn || column.subColumn.length==0"
            to="" @click.prevent="goFilelist()">
            {{props.column.titleZh}}
        </RouterLink>
        <span v-if="column.subColumn && column.subColumn.length>0">{{props.column.titleZh}}</span>
    </li>
    <ul class="columnList" v-if="column.subColumn && column.subColumn.length>0">
        <NaviColumn v-for="c in column.subColumn" :column=c :key="c.title"></NaviColumn>
    </ul>
</template>

<style>
ul.columnList {
  list-style-type: none;
  /* background-color: antiquewhite; */
}
ul.columnList li {
  margin: 5px 0px 0px 0px;
}
ul.columnList li a {
  background-color:rgb(220, 247, 202);
}
ul.columnList li:hover {
  background-color: cornsilk;
  display: inline-block;
}
</style>