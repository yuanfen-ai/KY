<template>
  <div id="app">
    <Dashboard />
  </div>
</template>

<script setup lang="ts">
import Dashboard from './views/Dashboard.vue';
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
