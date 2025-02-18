<template>
  <div class="wrapper">
    <div class="header">
      <div class="title">
        {{ title }}
      </div>
      <div class="close" @click="$emit('close')">
        <i class="el-icon-close"></i>
      </div>
    </div>
    <div class="body">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Panel',
  props: {
    title: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
  height: 100%;
  max-width: 407px;
  max-height: 276px;
  background: url('./images/bg.png') center / 100% 100% no-repeat;
  display: flex;
  flex-direction: column;
}
.header {
  position: relative;
}
.title {
  width: 100%;
  height: 42px;
  line-height: 42px;
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  text-align: center;
  padding-top: 6px;
}
.close {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 16px;
  color: #3daeff;
  cursor: pointer;
}
.body {
  flex: 1;
  overflow: hidden;
  padding: 10px;
  padding-top: 6px;
}
</style>
