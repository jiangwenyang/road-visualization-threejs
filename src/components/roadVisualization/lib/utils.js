import * as THREE from 'three'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import {
  DEVICE_MODEL_TYPE_MAP,
  INFORMATION_BOARD_DEVICE_MODEL_TYPE_MAP
} from './constant'

// 将16进制颜色转换为RGB
function intToRGB(colorValue) {
  // 将数字转换为字符串并填充到9位，不足的地方补0
  const colorString = colorValue.toString().padStart(9, '0')

  // 按每三位截取
  const red = parseInt(colorString.substring(0, 3))
  const green = parseInt(colorString.substring(3, 6))
  const blue = parseInt(colorString.substring(6, 9))

  return {
    red: red,
    green: green,
    blue: blue,
    rgb: `rgb(${red} ${green} ${blue})`
  }
}

// 渲染文本
function renderTextLine(line, canvasCtx) {
  const {
    startX,
    startY,
    content,
    font,
    fontSize,
    fontColor,
    backgroundColor
  } = line
  canvasCtx.fillStyle = intToRGB(backgroundColor).rgb
  canvasCtx.fillRect(startX, startY, fontSize, fontSize * content.length)
  canvasCtx.fillStyle = intToRGB(fontColor).rgb
  canvasCtx.font = `${fontSize}px ${font}`
  canvasCtx.textBaseline = 'top'
  canvasCtx.fillText(content, startX, startY)
}

// 渲染图片
function renderImageLine(line, canvasCtx) {
  const { startX, startY, imageAddress, width, height } = line
  const image = new Image()
  const base64Prefix = 'data:image/png;base64,'
  image.src = imageAddress.includes(base64Prefix)
    ? imageAddress
    : `${base64Prefix}${imageAddress}`
  image.onload = () => {
    canvasCtx.drawImage(image, startX, startY, width, height)
  }
}

// 渲染信息行
function renderLines(lines, canvasCtx) {
  lines.forEach(line => {
    const { areaType } = line
    if (areaType === 'Pic') {
      renderImageLine(line, canvasCtx)
    } else {
      renderTextLine(line, canvasCtx)
    }
  })
}

// 获取模型路径
function getModelPath(type, informationBoardDeviceType) {
  if (type === 'informationBoard') {
    return (
      INFORMATION_BOARD_DEVICE_MODEL_TYPE_MAP[informationBoardDeviceType] ||
      '恶劣天气-情报板.glb'
    )
  }
  return DEVICE_MODEL_TYPE_MAP[type]
}

// 加载模型
function loadModelByPath(path, basePath = 'three-assets/models/') {
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('three-assets/libs/')

  const loader = new GLTFLoader()
  loader.setDRACOLoader(dracoLoader)
  return new Promise((resolve, reject) => {
    loader.setPath(basePath).load(path, resolve, undefined, reject)
  })
}

// 获取取整后的桩号范围
function getPileRange(startPileNo, endPileNo) {
  if (startPileNo > endPileNo) {
    return [Math.ceil(startPileNo), Math.floor(endPileNo)]
  } else {
    return [Math.floor(startPileNo), Math.ceil(endPileNo)]
  }
}

// 解码html
function decodeHtml(html) {
  const txt = document.createElement('textarea')
  txt.innerHTML = html
  return txt.value
}

// 获取相对于canvas的位置
function getCanvasRelativePosition(event, canvas) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) * canvas.width) / rect.width,
    y: ((event.clientY - rect.top) * canvas.height) / rect.height
  }
}

// 获取鼠标相对于canvas的位置
// 用于将鼠标事件的位置转换为Three.js中的标准化设备坐标(Normalized Device Coordinates, NDC)。
// 这些坐标在范围[-1, 1]之间，并且使用了WebGL的坐标系统，其中原点在屏幕的中心，X轴向右为正，Y轴向上为正。
function getMousePosition(event, canvas) {
  const mouse = new THREE.Vector2()
  const pos = getCanvasRelativePosition(event, canvas)
  mouse.x = (pos.x / canvas.width) * 2 - 1
  mouse.y = (pos.y / canvas.height) * -2 + 1 // 翻转Y轴
  return mouse
}

// 从子对象中获取设备对象
function getDeviceObjectFromChild(object) {
  if (!object) {
    return null
  }

  // 如果有 userData 并且有 type 或 id 则返回
  if (object.userData && (object.userData.type || object.userData.id)) {
    return object
  } else if (object.parent) {
    return getDeviceObjectFromChild(object.parent)
  } else {
    return null
  }
}

// 修正模型位置
function fixModelCenter(model) {
  const box = new THREE.Box3().setFromObject(model)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  // 平移模型，使其中心点对齐到原点
  model.position.sub(center)
  model.translateY(size.y / 2)
}

// 移除并释放对象
function removeAndDisposeObject(object, scene) {
  // 移除并释放对象及其子对象
  object.traverse(function(child) {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (child.material.map) child.material.map.dispose()
        child.material.dispose()
      }
    }
  })

  scene.remove(object)
}

// 计算字体大小
function calculateFontSizeToFit(
  canvas,
  text,
  font = 'bold sans-serif',
  paddingLeft = 20,
  paddingRight = 20
) {
  const context = canvas.getContext('2d')
  const canvasWidth = canvas.width

  // 计算去掉 padding 后的有效宽度
  const effectiveWidth = canvasWidth - paddingLeft - paddingRight

  let fontSize = (effectiveWidth / String(text).length) * 1.5 // 初始字体大小，设置为一个较大的值
  context.font = `${fontSize}px ${font}`

  // 使用 measureText 计算文本宽度
  let textWidth = context.measureText(text).width

  // 逐步缩小字体大小，直到文本宽度接近有效宽度
  while (textWidth > effectiveWidth) {
    fontSize--
    context.font = `${fontSize}px ${font}`
    textWidth = context.measureText(text).width
  }

  return fontSize
}

export {
  getModelPath,
  loadModelByPath,
  getPileRange,
  decodeHtml,
  getMousePosition,
  getDeviceObjectFromChild,
  renderLines,
  fixModelCenter,
  removeAndDisposeObject,
  calculateFontSizeToFit
}
