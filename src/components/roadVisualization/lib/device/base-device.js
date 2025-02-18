import * as THREE from 'three'
import { getPileZ, getPileX, getPositionType } from '../helpers'
import { getModelPath, loadModelByPath, fixModelCenter } from '../utils'
import EventEmitter from 'eventemitter3'

// 基础设备
export default class BaseDevice extends EventEmitter {
  static modelType = {}
  static async loadModelByPath(modelPath) {
    if (!BaseDevice.modelType[modelPath]) {
      BaseDevice.modelType[modelPath] = await loadModelByPath(modelPath)
    }
    return BaseDevice.modelType[modelPath]
  }
  constructor(device, context, offset = [0, 0, 0]) {
    super()
    const { pileNo, directionName } = device
    const { config } = context
    this.context = context // 全局上下文
    this.data = device // 设备数据
    this.positionType = getPositionType(directionName, config.currentDirection) // 设备位置类型

    // 计算设备默认位置
    this.x = getPileX(context, directionName) + offset[0]
    this.y = 0 + offset[1]
    this.z = getPileZ(pileNo, context) + offset[2]

    this.modelPath = getModelPath(device.type)
    this.model = null
    this.modelScene = null
    this.group = new THREE.Group()
    this.group.name = device.data ? device.data.id : device.name

    this.group.userData = device

    this.eventEmitter = new EventEmitter()
  }
  async loadModel() {
    this.model = await BaseDevice.loadModelByPath(this.modelPath)
    this.modelScene = this.model.scene.clone()

    // 设置需要产生阴影的物体
    this.modelScene.traverse(child => {
      if (child.isMesh) {
        const shadow = this.context.options.shadow
        child.castShadow = shadow
        child.receiveShadow = shadow
      }
    })

    this.group.add(this.modelScene)
  }
  async init() {
    await this.loadModel()
    // 计算模型的包围盒的中心点
    fixModelCenter(this.modelScene)
    // 初始化位置
    this.initPosition()
  }
  // 初始化位置
  initPosition() {
    this.group.position.set(this.x, this.y, this.z)
  }
  // 更新位置
  updatePosition({ x, y, z }) {
    this.x = x || this.x
    this.y = y || this.y
    this.z = z || this.z
    this.initPosition()
  }
  // 销毁
  dispose() {
    this.removeAllListeners()
  }
}
