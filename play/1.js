import HelloWorld from "./components/HelloWorld.vue";
import { ref } from 'vue';

export function setup() {
  const text = ref('');
  return {
    text
  };
}
export default { setup };