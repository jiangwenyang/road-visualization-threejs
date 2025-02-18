import * as THREE from 'three'
import { calculateFontSizeToFit } from '../utils'

// 道路百米桩对（左右两侧）
export default class Pile {
  constructor(modelScene, pileNo, roadNo, roadName) {
    this.pileNo = pileNo // 桩号
    this.roadNo = roadNo // 路段
    this.roadName = roadName
    this.group = new THREE.Group()

    this.group.add(modelScene)

    const label = this.getLabel()
    this.group.add(label)

    const scale = 0.4
    this.group.scale.set(scale, scale, scale)

    // 设置需要产生阴影的物体
    this.group.traverse(function(child) {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }
  // 获取桩号标签画布
  getCanvas() {
    const ctx = document.createElement('canvas').getContext('2d')

    const width = 500
    const height = 500

    ctx.canvas.width = width
    ctx.canvas.height = height

    // 注意，调整画布后需要重新修改字体
    ctx.textBaseline = 'top'

    ctx.fillStyle = 'white'

    const getX = text => {
      return (width - ctx.measureText(text).width) / 2
    }

    let size = 210
    ctx.font = `${size}px bold sans-serif`

    const startY = height / 4 - size / 2
    ctx.fillText(this.pileNo, getX(this.pileNo), startY)

    let text = this.roadNo

    if (text && String(text).length > 4) {
      size = calculateFontSizeToFit(ctx.canvas, text)
    }

    if (!text && this.roadName) {
      text = this.roadName
      size = calculateFontSizeToFit(ctx.canvas, text)
    }

    if (text) {
      ctx.font = `${size}px bold sans-serif`
      ctx.fillText(text, getX(text), (height * 3) / 4 - size / 2)
    }

    return ctx.canvas
  }

  getLabel() {
    // 桩号标签纹理

    const texture = new THREE.CanvasTexture(this.getCanvas())
    texture.minFilter = THREE.LinearFilter
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping

    const labelGeometry = new THREE.PlaneGeometry(1.5, 1.85)

    // 桩号标签材质
    const labelMeterial = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.FrontSide,
      map: texture
    })

    const mesh = new THREE.Mesh(labelGeometry, labelMeterial)
    mesh.position.y = 2.42
    mesh.position.z = 0.15

    return mesh
  }
}
