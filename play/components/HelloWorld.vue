<script >
import { ref } from 'vue'
export default {
  name: 'HelloWorld',
  props: {
    msg: String,
    default: 'Hello World' 
  },
  setup(props) {
    const msg = ref(props.msg || 'Hello World')
    return { msg }
  }
}
</script>

<template>
  <h1>{{ msg }}</h1>

</template>

<style >
.read-the-docs {
  color: #888;
}
</style>
