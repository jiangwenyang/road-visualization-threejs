const CONFIG = {
  startPileNo: 1.2,
  endPileNo: 100,
  roadNum: 'G59',
  roadName: '示例路段',
  directionNames: ['上行', '下行'],
  currentDirection: '上行'
}

const isDevelopment = process.env.NODE_ENV === 'development'
const OPTIONS = {
  showGUI: isDevelopment, // 是否显示GUI
  showHelper: false && isDevelopment, // 是否显示辅助线
  showStats: isDevelopment, // 是否显示统计信息
  useMapControls: false, // 是否使用 MapControls 控件
  shadow: false, // 是否显示阴影
  randomCar: false, // 是否随机生成车辆
  randomCarMax: 5 // 随机生成车辆数量
}

// 设备位置类型
const POSITION_TYPE = {
  LEFT: 'left',
  RIGHT: 'right',
  CENTER: 'center'
}

// 设备模型路径
const DEVICE_MODEL_TYPE_MAP = {
  camera: '摄像头.glb',
  door: '龙门架.glb',
  car: '法拉利.glb'
}

// 情报板设备类型
const INFORMATION_BOARD_DEVICE_TYPE = {
  门架H: 1,
  悬臂F: 2,
  立柱T: 3
}

// 情报板设备模型路径
const INFORMATION_BOARD_DEVICE_MODEL_TYPE_MAP = {
  [INFORMATION_BOARD_DEVICE_TYPE['门架H']]: '龙门架.glb',
  [INFORMATION_BOARD_DEVICE_TYPE['悬臂F']]: '恶劣天气-情报板.glb',
  [INFORMATION_BOARD_DEVICE_TYPE['立柱T']]: '恶劣天气-情报板.glb'
}

export {
  CONFIG,
  OPTIONS,
  POSITION_TYPE,
  DEVICE_MODEL_TYPE_MAP,
  INFORMATION_BOARD_DEVICE_TYPE,
  INFORMATION_BOARD_DEVICE_MODEL_TYPE_MAP
}
