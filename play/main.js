import { createApp } from 'vue'
import './style.css'
import './scss.scss'
import App from './App.vue'

console.log(import.meta.env.VITE_TEST_KEY)
createApp(App).mount('#app')
