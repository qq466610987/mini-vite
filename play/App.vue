<script setup>
import HelloWorld from "./components/HelloWorld.vue";
import { ref } from 'vue'
const text = ref('vite+vue')

</script>
<template>
  <div class="title">
    {{ text }}
  </div>
  <HelloWorld msg="Vite + Vue" />
</template>

<style>
.title {
  color: red;
}
</style>
