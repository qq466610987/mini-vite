<script>
import HelloWorld from "./components/HelloWorld.vue";
import { ref } from 'vue'

export default {
  name: 'App',
  components: {
    HelloWorld
  },
  setup() {
    const text = ref('vite+vue')
    return { text }
  }
}
</script>
<template>
  <div class="title">
    {{ text }}
  </div>
  <HelloWorld msg="Hello World Component" />
</template>

<style>
.title {
  color: red;
}
</style>
