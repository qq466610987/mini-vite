import { createApp } from 'vue'
import './style.css'
import './scss.scss'
import App from './App.vue'
const a = import.meta.env.VITE_TEST_KEY
console.log(a)
createApp(App).mount('#app')
