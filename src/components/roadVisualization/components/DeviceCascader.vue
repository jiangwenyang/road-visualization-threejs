<template>
  <el-cascader
    v-bind="$attrs"
    :options="options"
    :props="{ emitPath: false }"
    style="width: 100%"
    filterable
    v-on="$listeners"
  />
</template>

<script>
import groupBy from "lodash/groupBy";
export default {
  name: "DeviceCascader",
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    options() {
      if (!this.data.length) {
        return [];
      }
      const typeMap = {
        camera: "摄像头",
        door: "门架",
        informationBoard: "情报板"
      };
      return Object.entries(groupBy(this.data, "type")).map(
        ([type, devices]) => {
          return {
            value: type,
            label: typeMap[type],
            children: devices.map(device => {
              return {
                value: device.data.id,
                label: device.name
              };
            })
          };
        }
      );
    }
  }
};
</script>
