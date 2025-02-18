<template>
  <div class="wrapper">
    <div
      class="arrow-btn"
      :class="{ disabled: rangeIndex === 0 }"
      @click="handlePrev"
    >
      <i class="el-icon-arrow-left"></i>
    </div>
    <div class="range-slider">
      <el-slider
        v-model="value"
        :min="currentRange.min"
        :max="currentRange.max"
        :format-tooltip="formatTooltip"
        :marks="currentRange.marks"
        show-stops
      >
      </el-slider>
    </div>

    <div
      class="arrow-btn"
      :class="{ disabled: rangeIndex === rangeList.length - 1 }"
      @click="handleNext"
    >
      <i class="el-icon-arrow-right"></i>
    </div>
  </div>
</template>

<script>
import { formatStake } from "../utils";
import { convertToRange, convertBackToOriginalRange } from "../utils";
export default {
  name: "PileNoRangeSlider",
  props: {
    min: {
      type: Number,
      default: 1.1,
    },
    max: {
      type: Number,
      default: 100,
    },
    gap: {
      type: Number,
      default: 10,
    },
  },
  data() {
    return {
      value: 0,
      rangeIndex: 0,
    };
  },
  computed: {
    rangeList() {
      const { max, gap } = this;
      let { min } = this;
      const rangeList = [];
      // 是否反向
      const isReverse = min > max;
      const gapValue = gap * (isReverse ? -1 : 1);

      while (isReverse ? min > max : min < max) {
        const end = isReverse
          ? Math.max(min + gapValue, max)
          : Math.min(min + gapValue, max);

        const length = Math.ceil(Math.abs(end - min));
        rangeList.push([min, end, length]);
        min = end;
      }
      return rangeList;
    },
    currentRange() {
      const [min, max, length] = this.rangeList[this.rangeIndex];
      const minValue = convertToRange(min, min, max, length);
      const maxValue = convertToRange(max, min, max, length);
      return {
        minOriginal: min,
        maxOriginal: max,
        min: minValue,
        max: maxValue,
        marks: Array.from({ length }).reduce((acc, cur, index) => {
          const value = minValue + index;

          return {
            ...acc,
            [value]: {
              label: formatStake(
                convertBackToOriginalRange(value, min, max, length)
              ),
              style: {
                color: "#FFF",
              },
            },
          };
        }, {}),
      };
    },
  },
  watch: {
    currentRange: {
      handler(val) {
        this.value = val.min;
        const { minOriginal, maxOriginal } = val;
        this.$emit("range-change", {
          min: minOriginal,
          max: maxOriginal,
        });
      },
      immediate: true,
    },
    value(val) {
      const [min, max, length] = this.rangeList[this.rangeIndex];

      const value = convertBackToOriginalRange(val, min, max, length);
      this.$emit("change", { value, min, max });
    },
  },
  methods: {
    handlePrev() {
      this.rangeIndex = Math.max(this.rangeIndex - 1, 0);
    },
    handleNext() {
      this.rangeIndex = Math.min(
        this.rangeIndex + 1,
        this.rangeList.length - 1
      );
    },
    formatTooltip(value) {
      const [min, max, length] = this.rangeList[this.rangeIndex];

      return formatStake(convertBackToOriginalRange(value, min, max, length));
    },
  },
};
</script>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}
.arrow-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  font-size: 30px;
  border-radius: 50%;
  margin: 0 20px;
  &.disabled {
    color: #ccc;
    cursor: not-allowed;
  }
}
.range-slider {
  flex: 1;
}
</style>
