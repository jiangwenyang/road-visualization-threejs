<template>
  <div class="container-box">
    <div class="item" v-for="(item, index) in data" :key="item.title">
      <Panel :title="item.title" @close="handleClose(index, item)">
        <slot v-bind="item"></slot>
      </Panel>
    </div>
  </div>
</template>

<script>
import Panel from './Panel'
export default {
  name: 'ContainerBox',
  components: {
    Panel
  },
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    handleClose(index, item) {
      this.$emit('remove', index, item)
    }
  }
}
</script>

<style lang="scss" scoped>
.container-box {
  position: absolute;
  z-index: 999;
  right: 0;
  top: 150px;
  width: 400px;
  max-height: 682px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  background: linear-gradient(
    180deg,
    rgba(0, 97, 168, 0.33) 0%,
    rgba(0, 50, 91, 0.25) 100%
  );
  box-shadow: inset 0px 0px 80px 1px #003c69;
  border-radius: 8px 8px 8px 8px;
  border: 1px solid #3daeff;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.item {
  width: 100%;
}
</style>
