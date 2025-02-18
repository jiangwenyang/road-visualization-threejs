import * as THREE from 'three'

import { BaseDevice } from './device'
import { POSITION_TYPE } from './constant'

export default class Car extends BaseDevice {
  constructor(car, context, offset = [0, 0, -1.5]) {
    const {
      roadSize,
      config: { currentDirection }
    } = context
    super(car, context, offset)

    this.lane = car.lane || 1 // 车道
    this.isControl = car.isControl || false // 是否控制
    this.direction = car.directionName === currentDirection ? 1 : -1 // 朝向，正向1还是反向-1

    this.autoPilot = false //  自动巡航标志

    this.originalPosition = null // 原始位置
    this.originRotation = null // 原始旋转
    this.wheels = []

    const safeX = 1.2 // 与路侧的安全距离
    const roadSafeSize = roadSize.x / 2 - safeX

    this.geofencing = {
      minx: this.direction === 1 ? safeX : -roadSafeSize,
      maxx: this.direction === 1 ? roadSafeSize : safeX,
      minz: -roadSize.z,
      maxz: 0
    } // 出界区域

    this.speed = car.speed || 0.5 // 速度
    this.turnSpeed = 0.05 // 转向速度
    this.keyStates = {} // 键盘状态
  }

  async init() {
    await super.init()
    this.setMaterial()
    this.transform()
    this.originalPosition = this.group.position.clone()
    this.originRotation = this.group.rotation.clone()
    this.registerEvent()
    this.animate()
  }
  setMaterial() {
    const carModel = this.modelScene
    // materials
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff0000,
      metalness: 1.0,
      roughness: 0.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03
    })

    const detailsMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 1.0,
      roughness: 0.5
    })

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.25,
      roughness: 0,
      transmission: 1.0
    })

    const shadow = new THREE.TextureLoader()
      .setPath('three-assets/textures/')
      .load('ferrari_ao.png')

    carModel.getObjectByName('body').material = bodyMaterial

    carModel.getObjectByName('rim_fl').material = detailsMaterial
    carModel.getObjectByName('rim_fr').material = detailsMaterial
    carModel.getObjectByName('rim_rr').material = detailsMaterial
    carModel.getObjectByName('rim_rl').material = detailsMaterial
    carModel.getObjectByName('trim').material = detailsMaterial

    carModel.getObjectByName('glass').material = glassMaterial

    this.wheels.push(
      carModel.getObjectByName('wheel_fl'),
      carModel.getObjectByName('wheel_fr'),
      carModel.getObjectByName('wheel_rl'),
      carModel.getObjectByName('wheel_rr')
    )

    // shadow
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4),
      new THREE.MeshBasicMaterial({
        map: shadow,
        blending: THREE.MultiplyBlending,
        toneMapped: false,
        transparent: true
      })
    )
    mesh.rotation.x = -Math.PI / 2
    mesh.renderOrder = 2
    carModel.add(mesh)
  }

  // 大小位置调整
  transform() {
    if (this.positionType === POSITION_TYPE.RIGHT) {
      this.group.position.x = 1.4 * this.lane
    } else {
      this.group.position.x = -1.4 * this.lane
    }
    if (this.direction === -1) {
      // 旋转180度
      this.group.rotation.y = Math.PI
    }
    this.group.scale.set(0.5, 0.5, 0.5)
  }

  // 监听事件
  // 统一在外层注册，避免多个实例
  registerEvent() {
    const whiteList = [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Space',
      'Escape'
    ]

    this.on('keydown', event => {
      if (!whiteList.includes(event.code) || event.target !== document.body) {
        return
      }

      this.emit('control', this.group, event.code, this.autoPilot)

      // 空格键切换自动驾驶
      if (event.code === 'Space') {
        this.toggleAutoPilot()
        return
      }

      // ESC键重置
      if (event.code === 'Escape') {
        this.reset()
        return
      }

      if (this.isControl) {
        // 关闭自动驾驶
        this.autoPilot = false
        // 其他键盘事件
        this.keyStates[event.code] = true
      }
    })

    this.on('keyup', event => {
      if (!whiteList.includes(event.code) || event.target !== document.body) {
        return
      }
      this.emit('control', this.group, event.code, this.autoPilot)
      if (this.isControl) {
        this.keyStates[event.code] = false
      }
    })

    if (this.data.on) {
      Object.entries(this.data.on).forEach(([key, value]) => {
        this.on(key, value)
      })
    }
  }

  // 轮胎转向
  wheelsTurnTo(turnDirection) {
    // 旋转角度
    let turnAngle = 0
    if (turnDirection) {
      turnAngle = turnDirection === 'LEFT' ? Math.PI / 9 : -Math.PI / 9
    }
    this.wheels[0].rotation.z = turnAngle
    this.wheels[1].rotation.z = turnAngle
  }

  // 旋转轮胎
  rotateWheels() {
    if (
      !(
        this.keyStates['ArrowUp'] ||
        this.keyStates['ArrowDown'] ||
        this.autoPilot
      )
    ) {
      return
    }
    const isForward = this.keyStates['ArrowUp'] || this.autoPilot

    const time = performance.now() / 100
    for (let i = 0; i < this.wheels.length; i++) {
      this.wheels[i].rotation.x =
        time * this.speed * (isForward ? -1 : 1) * this.direction
    }
  }

  // 动画
  animate() {
    requestAnimationFrame(() => this.animate())

    const inControl = Object.values(this.keyStates).some(item => item)
    // 如果没有控制，则不处理
    if (!(inControl || this.autoPilot)) {
      return
    }

    const vehicle = this.group
    const speed = this.speed
    const turnSpeed = this.turnSpeed
    let move = false
    let x = vehicle.position.x
    let z = vehicle.position.z

    if (
      (this.keyStates['ArrowUp'] && !this.keyStates['ArrowDown']) ||
      this.autoPilot
    ) {
      this.wheelsTurnTo()
      x -= Math.sin(vehicle.rotation.y) * speed // 前进
      z -= Math.cos(vehicle.rotation.y) * speed // 前进
      move = true
    }

    if (this.keyStates['ArrowDown'] && !this.keyStates['ArrowUp']) {
      this.wheelsTurnTo()
      x += Math.sin(vehicle.rotation.y) * speed // 后退
      z += Math.cos(vehicle.rotation.y) * speed // 后退
      move = true
    }

    if (this.keyStates['ArrowLeft']) {
      this.wheelsTurnTo('LEFT')
      vehicle.rotation.y += turnSpeed // 向左转
      move = true
    }
    if (this.keyStates['ArrowRight']) {
      this.wheelsTurnTo('RIGHT')
      vehicle.rotation.y -= turnSpeed // 向右转
      move = true
    }

    // 位置改变
    if (x != vehicle.position.x || z != vehicle.position.z) {
      // 手动控制，限制位置
      if (!this.autoPilot) {
        const { x: limitX, z: limitZ } = this.geofencingPosition(x, z)
        vehicle.position.x = limitX
        vehicle.position.z = limitZ
      } else {
        // 自动控制，检测是否到达终点，到达后重置
        if (z < this.geofencing.minz || z > this.geofencing.maxz) {
          this.resetCar()
        } else {
          vehicle.position.x = x
          vehicle.position.z = z
        }
      }
    }

    this.rotateWheels()

    if (move) {
      this.emit('move', this.group)
    }
  }

  // 出界区域处理
  geofencingPosition(x, z) {
    const { minx, maxx, minz, maxz } = this.geofencing
    if (x < minx) {
      x = minx
    }
    if (x > maxx) {
      x = maxx
    }
    if (z < minz) {
      z = minz
    }
    if (z > maxz) {
      z = maxz
    }
    return { x, z }
  }

  // 暂停自动驾驶
  pauseAutoPilot() {
    this.autoPilot = false
  }

  // 切换自动驾驶
  toggleAutoPilot() {
    this.autoPilot = !this.autoPilot

    if (this.autoPilot) {
      this.group.rotation.copy(this.originRotation)
      this.wheelsTurnTo()
      Object.keys(this.keyStates).forEach(key => {
        this.keyStates[key] = false
      })
    }
  }

  // 重置车辆
  resetCar() {
    this.group.position.copy(this.originalPosition)
    this.group.rotation.copy(this.originRotation)
    this.wheelsTurnTo()
    this.emit('move', this.group)
  }

  // 重设车辆位置
  reset() {
    this.autoPilot = false
    this.resetCar()
  }
}
