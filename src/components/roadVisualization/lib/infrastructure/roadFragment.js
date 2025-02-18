import * as THREE from 'three'
import { loadModelByPath, decodeHtml } from '../utils'

// 道路百米段
export default class RoadFragment {
  constructor(roadName, directionNames, shadow) {
    this.roadName = roadName
    this.directionNames = directionNames
    this.model = null
    this.directions = []
    this.group = new THREE.Group()
    this.box3 = null
    this.shadow = shadow
  }
  // 创建模型
  async createModel() {
    this.model = await loadModelByPath('马路.glb')

    // 设置需要产生阴影的物体
    this.model.scene.traverse(child => {
      if (child.isMesh) {
        child.castShadow = this.shadow
        child.receiveShadow = this.shadow
      }
    })
    this.group.add(this.model.scene)
  }
  // 添加方向
  addDirection() {
    // 获取方向的纹理
    const getTexture = text => {
      const decodedText = decodeHtml(text)
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      const textFontSize = 60
      const lineHeight = textFontSize * 1.5
      canvas.width = textFontSize
      canvas.height = lineHeight * (decodedText.length + 2)

      context.fillStyle = 'transparent'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = '#C3C3C3'
      context.font = `${textFontSize}px bold sans-serif`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      const x = canvas.width / 2

      const yStart = textFontSize

      for (let i = 0; i < decodedText.length; i++) {
        context.fillText(decodedText[i], x, yStart + i * lineHeight)
      }
      return new THREE.CanvasTexture(canvas)
    }
    const scale = 0.1
    const width = (this.box3.max.x - this.box3.min.x) * scale
    const height = (this.box3.max.z - this.box3.min.z) * scale
    const materialConfig = {
      // 颜色透明
      color: 0xffffff,
      side: THREE.FrontSide,
      // 允许透明（纹理贴图的透明部分不会被渲染出来）
      transparent: true,
      map: getTexture(`&uarr;${this.directionNames[0]}`)
    }

    const planeGeometry = new THREE.PlaneGeometry(width, height)
    const planeMaterial = new THREE.MeshBasicMaterial(materialConfig)
    let mesh = new THREE.Mesh(planeGeometry, planeMaterial)
    mesh.position.y = this.box3.max.y
    mesh.position.z = this.box3.max.z - height / 2

    const directionGroup = new THREE.Group()
    const xOffsetFactor = 1

    // 上行标识
    const upMesh = mesh.clone()
    upMesh.rotation.x = -Math.PI / 2
    upMesh.position.x = (this.box3.max.x / 2) * xOffsetFactor

    // 下行标识
    const downMesh = mesh.clone()
    const downMaterial = new THREE.MeshBasicMaterial({
      ...materialConfig,
      map: getTexture(`&uarr;${this.directionNames[1]}`)
    })
    downMesh.material = downMaterial
    downMesh.rotation.x = Math.PI / 2
    downMesh.rotation.y = Math.PI
    downMesh.position.x = (this.box3.min.x / 2) * xOffsetFactor
    downMesh.position.z = mesh.position.z - 2

    directionGroup.add(upMesh)
    directionGroup.add(downMesh)
    mesh = null

    this.group.add(directionGroup)

    const directionGroupClone = directionGroup.clone()
    directionGroupClone.position.z = this.box3.max.z
    this.group.add(directionGroupClone)
  }

  async init() {
    await this.createModel()
    this.box3 = new THREE.Box3().setFromObject(this.group)
    this.addDirection()
  }
}
