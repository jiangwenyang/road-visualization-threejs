import * as THREE from 'three'
import TWEEN from 'three/examples/jsm/libs/tween.module.js'
import GUI from 'lil-gui'

import Base3D from './base3D'

import {
  createGround,
  createRoad,
  createPiles,
  getRoadZFactor,
  createDevices,
  createCars,
  getPileZ,
  focusObject
} from './helpers'
import { removeAndDisposeObject } from './utils'
import { CONFIG, OPTIONS } from './constant'

export default class RoadVisualization extends Base3D {
  constructor(
    canvas, // 画布
    config = CONFIG, // 基础配置
    defaultDevices = [], // 默认设备
    options = OPTIONS, // 配置
    services // 服务
  ) {
    super(canvas, options)

    // 配置
    this.config = config // 基础配置
    this.devices = [...defaultDevices] // 设备列表
    this.services = services // 服务

    this.init()
  }

  initBaseValue() {
    // 固定对象列表
    this.fixedObjectList = [] // 固定对象组列表，道路、地面、桩号等
    this.deviceGroup = null // 设备组
    this.carGroup = null // 车组

    // 基础设施
    this.ground = null // 地面
    this.road = null // 道路
    this.roadZFactor = null // 道路Z轴比例,用于计算设备z轴坐标
    this.roadCenter = new THREE.Vector3() // 道路中心
    this.roadSize = new THREE.Vector3() // 道路大小
    this.piles = null // 桩号

    // 车辆
    this.carInstanceList = null // 车实例列表

    // 异步加载GUI
    this.gui = this.options.showGUI
      ? new GUI({
          title: '配置选项',
          container: this.canvas.parentNode
        })
      : null
  }

  // 创建GUI
  createGUI() {
    if (!this.gui) {
      return
    }
    this.gui
      .add(this.options, 'randomCar')
      .name('随机生成车辆')
      .onChange(() => {
        this.updateCars()
      })
    this.gui
      .add(this.options, 'randomCarMax')
      .name('随机生成车辆数量')
      .onChange(() => {
        this.updateCars()
      })
  }

  // 创建基础设施(道路、地面、桩号等)
  createInfrastructure() {
    return createRoad(this.scene, this.config, this.options).then(
      async road => {
        this.road = road
        this.fixedObjectList.push(this.road)
        this.roadZFactor = getRoadZFactor(road)

        const box3 = road._box3

        box3.getCenter(this.roadCenter)
        box3.getSize(this.roadSize)

        const { x, z } = this.roadSize

        // 创建地面
        this.ground = createGround(
          this.scene,
          x * 10,
          z + 20,
          this.options.shadow
        )
        this.fixedObjectList.push(this.ground)

        // 创建桩号
        const offsetX = 0.5
        const { upPileGroup, downPileGroup, pileGroup } = await createPiles(
          this.scene,
          this.config,
          this.roadZFactor
        )

        this.fixedObjectList.push(pileGroup)

        upPileGroup.position.x = road._box3.max.x + offsetX
        downPileGroup.position.x = road._box3.min.x - offsetX
      }
    )
  }

  // 创建设备
  async createDevices() {
    const { deviceGroup } = await createDevices(this.devices, this)
    this.deviceGroup = deviceGroup
  }

  // 创建车
  async createCars() {
    const {
      currentDirection,
      directionNames,
      startPileNo,
      endPileNo
    } = this.config
    const cars = [
      {
        name: '法拉利',
        directionName: currentDirection,
        type: 'car',
        isControl: true,
        on: {
          move: group => {
            focusObject(group, this, false)
          },
          control: (group, code, autoPilot) => {
            this.emit('car-control', group, code, autoPilot)
            focusObject(group, this, false)
          }
        },

        lane: 2
      }
    ]

    if (this.options.randomCar) {
      cars.push(
        ...Array.from({ length: this.options.randomCarMax }).map((_, i) => ({
          name: `车辆${i + 1}`,
          directionName: directionNames[Math.floor(Math.random() * 2)],
          pileNo: Math.random() * (endPileNo - startPileNo) + startPileNo,
          speed: Math.random() * 2,
          type: 'car',
          lane: Math.ceil(Math.random() * 2)
        }))
      )
    }

    // 创建车
    const { carGroup, carInstanceList } = await createCars(cars, this)

    this.carInstanceList = carInstanceList
    this.carGroup = carGroup
  }

  // 注册事件
  registerCarEvent() {
    document.addEventListener('keydown', event => {
      if (this.carInstanceList && this.carInstanceList.length > 0) {
        this.carInstanceList.forEach(item => item.emit('keydown', event))
      }
    })
    document.addEventListener('keyup', event => {
      if (this.carInstanceList && this.carInstanceList.length > 0) {
        this.carInstanceList.forEach(item => item.emit('keyup', event))
      }
    })
  }

  // 控制车
  controlCars(method) {
    if (!(this.carInstanceList && this.carInstanceList.length > 0)) {
      return
    }
    this.carInstanceList.forEach(item => item[method]())
  }

  // 创建固定物体
  updateFixedObjects() {
    this.fixedObjectList.forEach(item =>
      removeAndDisposeObject(item, this.scene)
    )
    this.fixedObjectList = []
    return this.createInfrastructure()
  }

  // 更新设备
  updateDevices() {
    if (this.deviceGroup) {
      removeAndDisposeObject(this.deviceGroup, this.scene)
      this.deviceGroup = null
    }

    // 创建设备
    this.createDevices()
  }

  // 更新车辆
  updateCars() {
    if (this.carGroup) {
      removeAndDisposeObject(this.carGroup, this.scene)
      this.carGroup = null
    }
    if (this.carInstanceList && this.carInstanceList.length > 0) {
      this.carInstanceList.forEach(item => item.dispose())
      this.carInstanceList = []
    }
    // 创建车
    this.createCars()
  }

  // 渲染物体
  async renderObjs() {
    await this.updateFixedObjects()
    this.updateDevices()
    this.updateCars()
    this.registerCarEvent()
  }

  // 跳转到Z轴指定位置
  goToZ(z) {
    const start = this.camera.position.clone()
    const offsetZ = 6
    const end = new THREE.Vector3(2, 3, z)
    new TWEEN.Tween(start)
      .to(end, 1000)
      .easing(TWEEN.Easing.Linear.None)
      .onUpdate(value => {
        this.camera.position.set(value.x, value.y, value.z + offsetZ)
        this.camera.lookAt(0, 0, value.z)
        if (this.controls) {
          this.controls.target.set(0, 0, value.z)
          this.controls.update()
        }
      })
      .start()
  }

  // 跳转到指定桩号
  goToPile(pile) {
    const z = getPileZ(pile, this)
    this.goToZ(z)
  }

  animate() {
    super.animate()
    TWEEN.update()
  }

  // 初始化
  init() {
    this.initBaseValue()
    this.renderObjs()
    this.createGUI()
  }

  // 销毁
  dispose() {
    super.dispose()
    if (this.carInstanceList) {
      this.carInstanceList.forEach(item => item.dispose())
    }
    this.initBaseValue()
  }
}
