<template>
  <div id="app">
    <RoadVisualization />
  </div>
</template>

<script>
import RoadVisualization from './components/roadVisualization/index.vue'

export default {
  name: 'App',
  components: {
    RoadVisualization
  }
}
</script>

<style lang="scss">
@import 'normalize.css';
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  background: #fff;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
