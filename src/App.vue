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

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
