<template>
  <div class="container">
    <template v-if="!loading">
      <canvas id="road-visualization-container" />

      <div class="control">
        <!-- <el-tooltip
        :content="isInAutoPilot ? '暂停车辆' : '运行车辆'"
        placement="top"
      >
        <div class="btn" @click="togglePlay">
          <i
            :class="isInAutoPilot ? 'el-icon-video-pause' : 'el-icon-video-play'"
          ></i>
        </div>
      </el-tooltip>

      <el-tooltip content="重置车辆" placement="top">
        <div class="btn" @click="resetPlay">
          <i class="el-icon-refresh-right"></i>
        </div>
      </el-tooltip>

      <el-tooltip content="车辆速度倍数" placement="top">
        <div class="sider">
          <el-slider
            v-model="speedFactor"
            :step="1"
            :marks="marks"
            show-stops
            :min="1"
            :max="5"
            show-tooltip
          >
          </el-slider>
        </div>
      </el-tooltip> -->
        <div class="btns">
          <div class="btn" @click="areaVisible = true">区域</div>
          <el-tooltip effect="dark" placement="top">
            <div slot="content" class="tips">
              <p>单击切换巡航状态，双击重置车辆位置。</p>
              <p>点击画面后可通过键盘控制车辆：</p>
              <ul class="keys">
                <li v-for="key in keys" :key="key.code" class="key-item">
                  <div class="key">
                    <i v-if="key.icon" class="key-icon" :class="key.icon"></i>
                    <span v-else class="key-text">{{ key.text }}</span>
                  </div>
                  <span class="desc">{{ key.desc }}</span>
                </li>
              </ul>
            </div>
            <div class="btn" @click="togglePlay" @dblclick="resetPlay">
              {{ isInAutoPilot ? "巡航中..." : "巡航" }}
            </div>
          </el-tooltip>
        </div>
        <div v-if="areaSetting.startPile || areaSetting.endPile" class="slider">
          <PileNoRangeSlider
            ref="PileNoRangeSlider"
            :min="areaSetting.startPile"
            :max="areaSetting.endPile"
            @range-change="handleRangeChange"
            @change="handlePileNoChange"
          />
        </div>
        <div>
          <DeviceCascader
            :key="devices.map((item) => item.data.id).join('')"
            v-model="currentDevice"
            :data="devices"
          />
        </div>
      </div>
      <Panel
        v-if="areaVisible"
        class="panel"
        title="区域选择"
        @close="areaVisible = false"
      >
        <div class="area-setting">
          <AreaSetting
            v-model="areaSetting"
            :road-list="roadList"
            @close="areaVisible = false"
          />
        </div>
      </Panel>

      <ContainerBox
        v-if="!!previewDevices.length"
        :data="previewDevices"
        @remove="handleRemove"
      >
        <template v-slot="{ type, data }">
          <div class="device-item">
            <component
              :is="componentMap[type].component"
              v-bind="componentMap[type].getProps(data)"
            />
          </div>
        </template>
      </ContainerBox>
    </template>
    <div v-else class="placeholder">
      <div class="logo"></div>
      <div class="text">{{ loadingMsg }}</div>
    </div>
  </div>
</template>

<script>
import RoadVisualization from "./lib";
import { CONFIG, OPTIONS } from "./lib/constant";
import Panel from "./components/Panel";
import AreaSetting from "./components/AreaSetting.vue";
import ContainerBox from "./components/ContainerBox.vue";
import { parseStake } from "./utils";
import PileNoRangeSlider from "./components/PileNoRangeSlider.vue";
import DeviceCascader from "./components/DeviceCascader.vue";

// 外部依赖
// import { getExpWayListExpWayAndRoadDirection } from '@/api/auth'
// import { getBaseEquipmentControllerListEquipmentByTrackNo } from '@/api/base'
// import { getCurrentProgram } from '@/api/infoIntelligenceBoard.js'
// import Video from '@/views/components/Video'

// 模拟数据
import fakeData from "./fakeData.json";
const getCurrentProgram = async () => fakeData.program;
const getExpWayListExpWayAndRoadDirection = async () => fakeData.roadData;
const getBaseEquipmentControllerListEquipmentByTrackNo = async () =>
  fakeData.deviceData;
const Video = null;

export default {
  name: "RoadVisualization",
  components: {
    Panel,
    AreaSetting,
    ContainerBox,
    PileNoRangeSlider,
    DeviceCascader,
  },
  props: {
    options: {
      type: Object,
      default: () => OPTIONS,
    },
  },
  data() {
    return {
      roadVisualizationInstance: null,
      isInAutoPilot: false,
      speedFactor: 1,
      marks: {
        1: "x1",
        2: "x2",
        3: "x3",
        4: "x4",
        5: "x5",
      },
      areaVisible: false,
      areaSetting: {
        roadId: "",
        startPile: "",
        endPile: "",
      },
      showRange: {
        startPile: "",
        endPile: "",
      },
      roadList: [],
      loading: true,
      loadingMsg: "加载路段配置中，请稍后...",
      devicesData: null,
      selectedDevices: [],
      componentMap: {
        camera: {
          component: Video,
          getProps: (data) => {
            return {
              camera: data,
            };
          },
        },
      },
      currentDevice: "",
      keys: [
        {
          code: "ArrowUp",
          icon: "el-icon-caret-top",
          desc: "前进",
        },
        {
          code: "ArrowDown",
          icon: "el-icon-caret-bottom",
          desc: "后退",
        },
        {
          code: "ArrowLeft",
          icon: "el-icon-caret-left",
          desc: "左转",
        },
        {
          code: "ArrowRight",
          icon: "el-icon-caret-right",
          desc: "右转",
        },
        {
          code: "Space",
          text: "空格键",
          desc: "开始巡航",
        },
        {
          code: "Escape",
          text: "ESC键",
          desc: "退出巡航",
        },
      ],
    };
  },

  computed: {
    currentRoad() {
      if (!this.areaSetting.roadId) {
        return null;
      }
      return this.roadList.find((item) => item.id === this.areaSetting.roadId);
    },
    currentDirections() {
      if (!this.currentRoad) {
        return [];
      }
      return (this.currentRoad.roadDirectionRelList || []).filter(
        (item) => !item.directionName.includes("双向")
      );
    },
    devices() {
      if (!this.devicesData) {
        return [];
      }

      // 获取方向名称
      const getDirectionName = (directionName) => {
        if (!this.currentDirections.length) {
          return directionName;
        }
        if (!directionName) {
          return this.currentDirections[0].directionName;
        }
        const direction = this.currentDirections.find(
          (item) =>
            item.id === directionName ||
            item.directionFlag === directionName ||
            item.directionName === directionName
        );

        return direction
          ? direction.directionName
          : this.currentDirections[0].directionName;
      };
      const keyMap = {
        cameraList: {
          type: "camera",
          getBaseInfo: (item) => {
            return {
              name: item.cameraName,
              pileNo: parseStake(item.cameraPileNo),
              directionName: getDirectionName(item.cameraUpDownFlag),
            };
          },
          filter: (item) => {
            const { startPile, endPile } = this.showRange;
            const { cameraPileNo } = item;
            const pile = parseStake(cameraPileNo);
            return startPile <= pile && pile <= endPile;
          },
        },
        boardList: {
          type: "informationBoard",
          getBaseInfo: (item) => {
            return {
              name: item.deviceName,
              pileNo: parseStake(item.stakeNumber),
              directionName: getDirectionName(item.roadDirectionId),
            };
          },
          filter: (item) => {
            const { startPile, endPile } = this.showRange;
            const { stakeNumber } = item;
            const pile = parseStake(stakeNumber);
            return startPile <= pile && pile <= endPile;
          },
        },
      };

      return Object.entries(this.devicesData)
        .map(([key, value]) => {
          return value.filter(keyMap[key].filter).map((item) => {
            const { type, getBaseInfo } = keyMap[key];

            return {
              type,
              data: item,
              ...getBaseInfo(item),
            };
          });
        })
        .flat();
    },
    config() {
      if (!this.currentRoad) {
        return CONFIG;
      }
      const { expressWayName, routeNum, roadDirectionRelList } =
        this.currentRoad;

      const { startPile, endPile } = this.showRange;

      const directionNames = (
        roadDirectionRelList || [
          {
            directionName: "上行",
          },
          {
            directionName: "下行",
          },
        ]
      )
        .slice(0, 2)
        .map((item) => item.directionName);

      return {
        startPileNo: startPile,
        endPileNo: endPile,
        roadNum: routeNum || "",
        roadName: expressWayName || "",
        directionNames,
        currentDirection: directionNames[0] || "",
      };
    },
    previewDevices() {
      return this.selectedDevices
        .filter((item) => item.type === "camera")
        .map((item) => ({
          title: item.name,
          type: item.type,
          data: item,
        }));
    },
  },
  watch: {
    roadList() {
      if (this.roadList.length == 0) {
        return;
      }
      const { id, startStake, endStake } = this.roadList[0];
      this.areaSetting = {
        roadId: id,
        startPile: startStake,
        endPile: endStake,
      };
    },
    areaSetting(val) {
      this.showRange = {
        startPile: val.startPile,
        endPile: val.endPile,
      };
    },
    speedFactor(val) {
      this.roadVisualizationInstance.speedFactor = val;
    },
    currentRoad() {
      this.getDevices();
    },
    config(val) {
      if (!(this.roadVisualizationInstance && val)) {
        return;
      }
      this.roadVisualizationInstance.config = val;
      this.roadVisualizationInstance.updateFixedObjects();
      this.roadVisualizationInstance.updateCars();
      this.roadVisualizationInstance.resetCameraPosition();
    },
    devices(val) {
      this.currentDevice = "";
      this.selectedDevices = [];

      if (!this.roadVisualizationInstance) {
        return;
      }

      this.roadVisualizationInstance.devices = val;
      this.roadVisualizationInstance.updateDevices();
      this.roadVisualizationInstance.resetCameraPosition();
    },
    currentDevice(val) {
      const device = this.devices.find((item) => item.data.id === val);

      if (device && this.roadVisualizationInstance) {
        const { id } = device.data;
        this.roadVisualizationInstance.controlCars("pauseAutoPilot");
        this.roadVisualizationInstance.focusObjectByName(id);
      }
    },
  },
  async mounted() {
    await this.getRoadList();
    this.init();
  },
  destroyed() {
    this.roadVisualizationInstance && this.roadVisualizationInstance.dispose();
  },
  methods: {
    async getRoadList() {
      this.loading = true;
      const res = await getExpWayListExpWayAndRoadDirection().catch((error) => {
        console.error(error);
      });

      this.roadList = res && res.data ? res.data : [];
      this.loading = false;
    },
    async getDevices() {
      const { roadId, startPile, endPile } = this.areaSetting;
      const res = await getBaseEquipmentControllerListEquipmentByTrackNo({
        expressWayId: roadId,
        startPileNo: startPile,
        endPileNo: endPile,
      }).catch((error) => {
        console.error(error);
      });
      this.devicesData = res && res.data ? res.data : null;
    },
    async init() {
      const canvas = document.getElementById("road-visualization-container");
      // 默认静态设备
      const defaultDevices = this.devices;
      // 创建实例
      this.roadVisualizationInstance = new RoadVisualization(
        canvas,
        this.config,
        defaultDevices,
        this.options,
        {
          informationFether: getCurrentProgram,
        }
      );
      this.registerEvent();
    },
    togglePlay() {
      this.isInAutoPilot = !this.isInAutoPilot;

      if (this.roadVisualizationInstance) {
        this.roadVisualizationInstance.controlCars("toggleAutoPilot");
      }
    },
    resetPlay() {
      this.isInAutoPilot = false;
      if (this.roadVisualizationInstance) {
        this.roadVisualizationInstance.controlCars("reset");
      }
    },
    handleRemove(index, item) {
      const removeIndex = this.selectedDevices.indexOf(item);
      this.selectedDevices.splice(removeIndex, 1);
    },
    registerEvent() {
      this.roadVisualizationInstance.on("click", this.handleClick);
      this.roadVisualizationInstance.on("car-control", this.handleCarControl);
    },
    handleClick(data) {
      if (this.selectedDevices.includes(data)) {
        return;
      }
      this.selectedDevices.push(data);
    },
    handleCarControl(group, code, autoPilot) {
      this.isInAutoPilot = autoPilot;
    },
    handleRangeChange(val) {
      if (!val) {
        return;
      }
      const { min, max } = val;
      this.showRange = {
        startPile: min,
        endPile: max,
      };
    },
    handlePileNoChange({ value, min, max, strict = false }) {
      if (!(value && this.roadVisualizationInstance)) {
        return;
      }
      this.roadVisualizationInstance.controlCars("pauseAutoPilot");
      if (strict) {
        this.roadVisualizationInstance.goToPile(parseStake(value));
        return;
      }
      const isReverse = min > max;
      const method = isReverse ? "ceil" : "floor";
      this.roadVisualizationInstance.goToPile(Math[method](parseStake(value)));
    },
  },
};
</script>

<style lang="scss">
.lil-gui {
  position: absolute;
  top: 0;
  right: 0;
}
</style>

<style lang="scss" scoped>
.container {
  position: relative;
  width: 100%;
  height: 100%;
}

#road-visualization-container {
  width: 100%;
  height: 100%;
  display: block;
}

.control {
  height: 129px;
  overflow: hidden;
  background: linear-gradient(
    180deg,
    rgba(0, 78, 195, 0) 0%,
    rgba(0, 18, 79, 0.37) 100%
  );
  box-shadow: inset 0px 0px 80px 1px #003c69;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px;
}
.btns {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.slider {
  flex: 1;
}
.btn {
  width: 85px;
  height: 35px;
  line-height: 35px;
  background: linear-gradient(180deg, #0061a8 0%, #00325b 100%);
  border-radius: 8px 8px 8px 8px;
  border: 1px solid #3daeff;
  cursor: pointer;
  color: #fff;
  text-align: center;
  font-size: 14px;
}
.sider {
  width: 200px;
  margin-left: 10px;
}
.panel {
  position: absolute;
  bottom: 218px;
  left: 20px;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

@keyframes flip {
  0% {
    transform: rotateY(0);
  }

  25% {
    transform: rotateY(0.5turn);
  }

  50% {
    transform: rotateY(0.5turn) rotateX(0.5turn);
  }

  75% {
    transform: rotateY(1turn) rotateX(0.5turn);
  }

  100% {
    transform: rotateY(1turn) rotateX(1turn);
  }
}

.logo {
  position: relative;
  width: 100px;
  height: 100px;
  overflow: hidden;
  background-color: hsl(241, 99%, 70%);
  border-radius: 50%;
  animation: 2s flip infinite;
}

.logo::after {
  position: absolute;
  top: -40%;
  right: -40%;
  width: 100%;
  height: 100%;
  background-color: hsl(186, 84%, 74%);
  border-radius: 50%;
  content: "";
}

.text {
  margin-top: 20px;
  color: hsl(211, 19%, 70%);
  font-weight: bold;
  font-size: 30px;
}
.area-setting {
  width: 100%;
  height: 100%;
  padding: 10px;
}
.device-item {
  width: 100%;
  height: 220px;
}

.tips {
  font-size: 14px;
}
.keys {
  list-style: none;
  padding-inline-start: 0;
}
.key-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
  .key {
    width: 50px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: #424242;
    border: 1px solid #fff;
    border-radius: 4px;
    color: #fff;

    padding: 4px;
    .key-icon {
      font-size: 20px;
    }
    .key-text {
      font-size: 12px;
    }
  }

  .desc {
    flex: 1;
    font-size: 14px;
  }
}
</style>
