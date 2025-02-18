import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MapControls } from 'three/examples/jsm/controls/MapControls.js'

import EventEmitter from 'eventemitter3'

import {
  resizeRendererToDisplaySize,
  createAmbientLight,
  createDirectionalLight,
  createDirectionalLightHelper,
  createGridHelper,
  createAxesHelper,
  createStats,
  createSceneSkyTexture,
  updateLightCamera,
  getEventObject,
  focusObject
} from './helpers'

import { removeAndDisposeObject } from './utils'

import { OPTIONS } from './constant'

export default class Base3D extends EventEmitter {
  constructor(canvas, options = OPTIONS) {
    super()
    // 容器
    this.canvas = canvas

    // 配置
    this.options = { ...OPTIONS, ...options } // 配置选项

    this.baseInit()
  }

  // 创建渲染器
  createRenderer() {
    const canvas = this.canvas
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas
    })
    this.renderer.shadowMap.enabled = this.options.shadow
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap // default THREE.PCFShadowMap
  }

  // 创建场景
  createScene() {
    const scene = new THREE.Scene()
    createSceneSkyTexture(scene, this.renderer)
    this.scene = scene
  }

  // 创建摄像机
  createCamera() {
    const fov = 75
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight
    const near = 1
    const far = 1000
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
    this.camera = camera
    this.resetCameraPosition()
  }

  // 重置摄像机
  resetCameraPosition() {
    if (this.options.useMapControls) {
      this.camera.position.set(0, 3, 6)
    } else {
      this.camera.position.set(0, 5, 6)
    }
    this.camera.lookAt(0, 0, 0)
  }

  // 创建光源
  createLight() {
    this.ambientLight = createAmbientLight(this.scene)
    this.directionalLight = createDirectionalLight(
      this.scene,
      this.camera.position,
      this.options.shadow
    )
  }

  // 创建控件
  createControls() {
    let controls = null

    if (this.options.useMapControls) {
      controls = new MapControls(this.camera, this.renderer.domElement)
    } else {
      controls = new OrbitControls(this.camera, this.renderer.domElement)
    }
    // 允许控制器阻尼，开启后必须在render中调用update
    controls.enableDamping = true
    controls.dampingFactor = 0.05

    controls.update()
    this.controls = controls
    this.registerControlEvent()
  }

  // 监听控制器事件
  registerControlEvent() {
    if (this.options.shadow) {
      // 更新方向光，保证阴影
      this.controls.addEventListener('change', () =>
        updateLightCamera(this.directionalLight, this.camera.position)
      )
    }
  }

  // 创建光源辅助线
  createHelper() {
    this.gridHelper = createGridHelper(this.scene)
    this.axesHelper = createAxesHelper(this.scene)
    this.directionalLightHelper = createDirectionalLightHelper(
      this.scene,
      this.directionalLight,
      this.options.shadow
    )
  }

  // 创建统计信息
  createStats() {
    this.stats = createStats(this.renderer)
  }

  // 销毁统计信息
  disposeStats() {
    if (!this.stats) {
      return
    }
    const statsDom = this.stats.dom
    if (statsDom && statsDom.parentNode) {
      statsDom.parentNode.removeChild(statsDom)
    }
  }

  // 渲染
  render() {
    if (resizeRendererToDisplaySize(this.renderer)) {
      const canvas = this.renderer.domElement
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight
      this.camera.updateProjectionMatrix()
    }

    this.renderer.render(this.scene, this.camera)
  }

  // 动画
  animate() {
    // 如果开启了控制器阻尼，则需要手动调用update方法
    if (this.controls && this.controls.enableDamping) {
      this.controls.update()
    }
    this.render()
    this.stats && this.stats.update()
  }

  initEvent() {
    this.canvas.addEventListener('click', event => {
      const object = getEventObject(event, this)
      if (object && object.userData) {
        this.emit('click', object.userData, object)
      }
    })
  }

  // 根据名称聚焦对象
  focusObjectByName(name) {
    const object = this.scene.getObjectByName(name)
    if (!object) {
      return
    }
    focusObject(object, this)
  }

  initValue() {
    // 实例
    this.scene = null // 场景
    this.camera = null // 摄像机
    this.renderer = null // 渲染器
    this.controls = null // 控件
    this.ambientLight = null // 环境光
    this.directionalLight = null // 方向光
    this.gridHelper = null // 网格辅助线
    this.axesHelper = null // 坐标轴辅助线
    this.directionalLightHelper = null // 方向光源辅助线
    this.stats = null // 统计信息
  }

  // 初始化
  baseInit() {
    this.initValue()
    this.createRenderer()
    this.createScene()
    this.createCamera()
    this.createLight()
    this.createControls()

    if (this.options.showHelper) {
      this.createHelper()
    }

    if (this.options.showStats) {
      this.createStats()
    }
    this.renderer.setAnimationLoop(() => this.animate())
    this.initEvent()
  }

  // 销毁
  dispose() {
    this.scene.children.forEach(item =>
      removeAndDisposeObject(item, this.scene)
    )
    this.renderer.dispose()
    if (this.controls) {
      this.controls.dispose()
    }
    if (this.stats) {
      this.disposeStats()
    }
    this.renderer.setAnimationLoop(null)
    this.initValue()
  }
}
