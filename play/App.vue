<script setup>
import HelloWorld from "./components/HelloWorld.vue";
import { ref } from 'vue'
const text = ref('')
</script>
<template>
  <div class="title">
    {{ text }}
  </div>
  <HelloWorld msg="Vite + Vue" />
</template>

<style scoped>
.title {
  color: red;
}
</style>

