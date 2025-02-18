import * as THREE from 'three'
import TWEEN from 'three/examples/jsm/libs/tween.module.js'

import Stats from 'three/examples/jsm/libs/stats.module.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

import { RoadFragment, Pile } from './infrastructure/index'
import {
  getPileRange,
  getModelPath,
  loadModelByPath,
  fixModelCenter,
  getMousePosition,
  getDeviceObjectFromChild
} from './utils'
import {
  BaseDevice,
  CameraDevice,
  InformationBoardDevice,
  DoorDevice
} from './device/index.js'
import Car from './car'
import { DEVICE_MODEL_TYPE_MAP, POSITION_TYPE } from './constant'

// 调整渲染器大小
export function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement
  const pixelRatio = window.devicePixelRatio
  const width = Math.floor(canvas.clientWidth * pixelRatio)
  const height = Math.floor(canvas.clientHeight * pixelRatio)
  const needResize = canvas.width !== width || canvas.height !== height
  if (needResize) {
    renderer.setSize(width, height, false)
  }
  return needResize
}

// 创建环境光
export function createAmbientLight(scene, color = 0xffffff, intensity = 1) {
  const light = new THREE.AmbientLight(color, intensity)
  scene.add(light)
  return light
}

// 更新阴影相机位置
export function updateLightCamera(light, position) {
  light.position.set(position.x + 10, position.y + 10, position.z + 10)
  light.target.position.set(position.x, position.y, position.z)

  const shadowRange = 50 // 定义阴影相机的范围
  light.shadow.camera.left = position.x - shadowRange
  light.shadow.camera.right = position.x + shadowRange
  light.shadow.camera.top = position.y + shadowRange
  light.shadow.camera.bottom = position.y - shadowRange
  light.shadow.camera.near = position.z - shadowRange
  light.shadow.camera.far = position.z + shadowRange

  light.target.updateMatrixWorld()
}

// 创建方向光
export function createDirectionalLight(
  scene,
  position,
  shadow = true,
  color = 0xffffff,
  intensity = 1
) {
  const light = new THREE.DirectionalLight(color, intensity)
  light.castShadow = shadow

  light.shadow.mapSize.width = 4096
  light.shadow.mapSize.height = 4096
  light.shadow.bias = -0.0005 // 解决条纹阴影的出现
  updateLightCamera(light, position)

  scene.add(light)
  return light
}

// 创建光源辅助线
export function createDirectionalLightHelper(scene, light, shadow) {
  const lightHelper = new THREE.DirectionalLightHelper(light)

  if (shadow) {
    const shadowCameraHelper = new THREE.CameraHelper(light.shadow.camera)
    scene.add(shadowCameraHelper)
  }

  scene.add(lightHelper)
  return lightHelper
}

// 创建网格辅助线
export function createGridHelper(
  scene,
  size = 10000,
  divisions = 1000,
  colorCenterLine = 0x44aa88,
  colorGrid = 0x777777
) {
  const gridHelper = new THREE.GridHelper(
    size,
    divisions,
    colorCenterLine,
    colorGrid
  )
  scene.add(gridHelper)
  return gridHelper
}

// 创建坐标轴辅助线
export function createAxesHelper(scene, size = 100) {
  const axesHelper = new THREE.AxesHelper(size)
  scene.add(axesHelper)
  return axesHelper
}

// 创建统计信息
export function createStats(renderer) {
  const stats = new Stats()
  stats.dom.style.position = 'absolute'
  stats.dom.style.top = '0px'
  renderer.domElement.parentNode.appendChild(stats.dom)
  return stats
}

// 创建场景的天空纹理
export function createSceneSkyTexture(scene) {
  // 加载hdr
  const hdrUrl = 'rooitou_park_4k.hdr'
  new RGBELoader().setPath('three-assets/textures/').load(hdrUrl, envMap => {
    // hdr作为环境贴图生效，设置.mapping为EquirectangularReflectionMapping
    scene.environment = envMap
    envMap.mapping = THREE.EquirectangularReflectionMapping
  })

  // 加载天空纹理
  const urls = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']
  const background = new THREE.CubeTextureLoader()
    .setPath('three-assets/textures/')
    .load(urls)
  scene.background = background
}

// 创建地面
export function createGround(
  scene,
  width = 1000,
  height = 10000,
  shadow = false
) {
  const textureLoader = new THREE.TextureLoader()

  const groundTexture = textureLoader
    .setPath('three-assets/textures/')
    .load('ground.jpg')

  groundTexture.wrapS = THREE.RepeatWrapping
  groundTexture.wrapT = THREE.RepeatWrapping
  groundTexture.repeat.set(width / 2, height / 2)

  const groundMaterial = new THREE.MeshBasicMaterial({ map: groundTexture })
  // const groundMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
  const groundGeometry = new THREE.PlaneGeometry(width, height)

  const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial)
  groundMesh.receiveShadow = shadow

  groundMesh.rotation.x = -Math.PI / 2
  groundMesh.position.z = -height / 2 + 10

  scene.add(groundMesh)
  return groundMesh
}

// 创建道路
export async function createRoad(scene, config, options) {
  const { startPileNo, endPileNo, roadName, directionNames } = config
  const pileRange = getPileRange(startPileNo, endPileNo)

  const group = new THREE.Group()
  const roadFragmentInsance = new RoadFragment(
    roadName,
    directionNames,
    options.shadow
  )
  await roadFragmentInsance.init()
  const roadFragmentGroup = roadFragmentInsance.group
  const roadFragmentBox3 = roadFragmentInsance.box3

  const length = Math.abs(pileRange[1] - pileRange[0])

  for (let i = 0; i < length; i++) {
    const roadFragmentClone = roadFragmentGroup.clone()
    roadFragmentClone.position.z =
      roadFragmentBox3.min.z * 2 * i - roadFragmentBox3.max.z
    roadFragmentClone.position.y = -roadFragmentBox3.max.y / 2 - 0.08

    group.add(roadFragmentClone)
  }

  scene.add(group)

  const box3 = new THREE.Box3().setFromObject(group)
  group._length = length
  group._box3 = box3
  group._roadFragmentBox3 = roadFragmentBox3

  return group
}

// 创建桩号
export async function createPiles(scene, config, roadZFactor) {
  const model = await loadModelByPath('恶劣天气-路桩.gltf')
  const modelScene = model.scene
  fixModelCenter(modelScene)

  const { startPileNo, endPileNo, roadNum, roadName } = config

  const pileRange = getPileRange(startPileNo, endPileNo)

  const upPileGroup = new THREE.Group()
  const downPileGroup = new THREE.Group()

  const length = Math.abs(pileRange[1] - pileRange[0])

  // 增加还是减少
  const add = pileRange[1] > pileRange[0] ? 1 : -1

  for (let i = 0; i <= length; i++) {
    const pile = new Pile(
      modelScene.clone(),
      pileRange[0] + add * i,
      roadNum,
      roadName
    ).group
    pile.position.z = -i * roadZFactor

    const upPile = pile.clone()
    const downPile = upPile.clone()
    downPile.rotation.y = Math.PI
    downPile.position.x = 0

    upPileGroup.add(upPile)
    downPileGroup.add(downPile)
  }

  const pileGroup = new THREE.Group()
  pileGroup.add(upPileGroup)
  pileGroup.add(downPileGroup)

  scene.add(pileGroup)

  return {
    pileGroup,
    upPileGroup,
    downPileGroup
  }
}

// 获取道路Z轴比例
export function getRoadZFactor(road) {
  const size = new THREE.Vector3()
  road._roadFragmentBox3.getSize(size)
  return size.z
}

// 根据桩号确定Z轴坐标
export function getPileZ(pileNo, context) {
  if (!pileNo) {
    return 0
  }
  const { startPileNo, endPileNo } = context.config
  const { roadZFactor } = context
  const [start] = getPileRange(startPileNo, endPileNo)
  return -Math.abs(pileNo - start) * roadZFactor
}

// 根据方向和当前方向获取位置类型
export function getPositionType(directionName, currentDirection) {
  let directionType = POSITION_TYPE.CENTER

  if (directionName) {
    directionType =
      currentDirection === directionName
        ? POSITION_TYPE.RIGHT
        : POSITION_TYPE.LEFT
  }

  return directionType
}

// 根据桩号和方向确定X轴坐标
export function getPileX(context, directionName) {
  if (!directionName) {
    return 0
  }
  const { roadCenter, roadSize, config } = context
  const { currentDirection } = config

  const offsetX = {
    [POSITION_TYPE.LEFT]: [-(roadSize.x / 2)],
    [POSITION_TYPE.RIGHT]: [roadSize.x / 2],
    [POSITION_TYPE.CENTER]: 0
  }

  const directionType = getPositionType(directionName, currentDirection)

  return Number(roadCenter.x) + Number(offsetX[directionType])
}

// 加载所有设备模型
async function loadAllDeviceModels(devices) {
  const deviceTypeSet = [...new Set(devices.map(device => device.type))]
  const informationBoardDeviceTypeSet = [
    ...new Set(
      devices
        .filter(device => device.type === 'informationBoard')
        .map(device => device.data.deviceType)
    )
  ]

  return Promise.all(
    deviceTypeSet.map(deviceType => {
      // 情报板不同设备类型模型不一样，需要单独加载
      if (deviceType === 'informationBoard') {
        return Promise.all(
          informationBoardDeviceTypeSet.map(informationBoardDeviceType => {
            return BaseDevice.loadModelByPath(
              getModelPath(deviceType, informationBoardDeviceType)
            )
          })
        )
      }

      return BaseDevice.loadModelByPath(getModelPath(deviceType))
    })
  )
}

// 创建设备
export async function createDevices(devices, context) {
  const deviceGroup = new THREE.Group()
  deviceGroup.name = 'deviceGroup'

  const allPositionList = []

  await loadAllDeviceModels(devices)

  const deviceInstanceList = await Promise.all(
    devices.map(async device => {
      let deviceInstance = null
      switch (device.type) {
        case 'camera':
          deviceInstance = new CameraDevice(device, context)
          break
        case 'informationBoard':
          deviceInstance = new InformationBoardDevice(device, context)
          break
        case 'door':
          deviceInstance = new DoorDevice(device, context)
          break
      }

      await deviceInstance.init()
      const group = deviceInstance.group

      // 检测设备位置是否重叠
      // 精度为0.5, 如果重叠则尝试增加位置
      const factor = 0.5
      const offsetZ = 2
      const isOverlap = allPositionList.some(position => {
        return (
          Math.abs(position.x - group.position.x) < factor &&
          Math.abs(position.z - group.position.z) < factor
        )
      })

      if (isOverlap) {
        group.position.z -= offsetZ
      }

      // 记录所有设备位置, 规避位置重叠
      allPositionList.push(group.position)

      deviceGroup.add(group)
      return deviceInstance
    })
  )

  context.scene.add(deviceGroup)

  return { deviceGroup, deviceInstanceList }
}

// 创建车
export async function createCars(cars, context) {
  const carGroup = new THREE.Group()
  carGroup.name = 'carGroup'

  await BaseDevice.loadModelByPath(DEVICE_MODEL_TYPE_MAP['car'])

  const carInstanceList = await Promise.all(
    cars.map(async car => {
      const carInstance = new Car(car, context)
      await carInstance.init()
      const group = carInstance.group
      carGroup.add(group)
      return carInstance
    })
  )

  context.scene.add(carGroup)
  return { carGroup, carInstanceList }
}

// 判断对象是否在视锥体内
export function isObjectInView(object, camera) {
  // 初始化视锥体和摄像机视图投影矩阵
  camera.updateMatrixWorld()
  const cameraViewProjectionMatrix = new THREE.Matrix4()
  cameraViewProjectionMatrix.multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  )
  const frustum = new THREE.Frustum()
  frustum.setFromProjectionMatrix(cameraViewProjectionMatrix)

  // 递归检测对象是否在视锥体内
  function checkObjectInView(obj) {
    if (obj.isMesh) {
      // 手动更新对象的世界矩阵
      obj.updateMatrixWorld(true)

      // 确保对象的几何体存在，并且已经计算了边界球
      if (obj.geometry && !obj.geometry.boundingSphere) {
        obj.geometry.computeBoundingSphere()
      }

      // 检查对象是否在视锥体内
      if (frustum.intersectsObject(obj)) {
        return true // 对象在视野内
      }
    } else if (
      (obj.isGroup || obj.isObject3D) &&
      obj.children &&
      obj.children.length
    ) {
      // 如果对象是一个 Group，递归检查其子对象
      for (let i = 0; i < obj.children.length; i++) {
        if (checkObjectInView(obj.children[i])) {
          return true // 只要有一个子对象在视野内，就返回 true
        }
      }
    }
    return false // 对象或所有子对象都不在视野内
  }

  return checkObjectInView(object)
}

// 处理事件
export function getEventObject(event, context) {
  const raycaster = new THREE.Raycaster()
  const mouse = getMousePosition(event, context.canvas)
  raycaster.setFromCamera(mouse, context.camera)
  const intersects = raycaster.intersectObjects(context.scene.children, true)
  if (intersects.length > 0) {
    const object = getDeviceObjectFromChild(intersects[0].object)
    return object
  }
}

// 聚焦到指定对象
export function focusObject(object, context, tween = true) {
  const { directionName } = object.userData

  let offsetZ
  if (directionName) {
    const directionType = getPositionType(
      directionName,
      context.config.currentDirection
    )
    offsetZ = directionType === POSITION_TYPE.RIGHT ? 5 : -5
  }

  const start = context.camera.position.clone()
  const end = object.position.clone()

  const update = value => {
    if (context.camera) {
      context.camera.position.set(value.x, 4, value.z + offsetZ)
      context.camera.lookAt(value.x, value.y, value.z)
    }

    if (context.controls) {
      context.controls.target.set(value.x, value.y, value.z)
      context.controls.update()
    }
  }

  if (tween) {
    new TWEEN.Tween(start)
      .to(end, 1000)
      .easing(TWEEN.Easing.Linear.None)
      .onUpdate(update)
      .start()
  } else {
    update(end)
  }

  // if (context.camera) {
  //   context.camera.position.set(x, 4, z + offsetZ);
  //   context.camera.lookAt(x, y, z);
  // }

  // if (context.controls) {
  //   context.controls.target.set(x, y, z);
  //   context.controls.update();
  // }
}
