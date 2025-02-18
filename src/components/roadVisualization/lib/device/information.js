import * as THREE from 'three'
import { renderLines } from '../utils'

// 情报板信息展示
export default class Information {
  constructor(data, playList, context) {
    this.context = context

    // 情报板数据
    this.data = data

    // 情报板canvas ctx，用于渲染和更新情报板
    this.boardCanvasCtx = null
    // 情报板材质，用于通知更新材质
    this.boardTexture = null

    // 最终渲染的情报板
    this.group = new THREE.Group()

    // 播放列表
    this.playList = playList || []
    this.currentPlayIndex = 0
    this.lastTime = 0

    this.init()
  }

  // 创建情报板canvas
  createCanvas() {
    const { deviceWidth, deviceHight } = this.data.data
    this.boardCanvasCtx = document.createElement('canvas').getContext('2d')
    this.boardCanvasCtx.canvas.width = deviceWidth
    this.boardCanvasCtx.canvas.height = deviceHight
  }
  // 创建材质
  createBoardTexture() {
    this.boardTexture = new THREE.CanvasTexture(this.boardCanvasCtx.canvas)
  }
  // 创建情报板
  createBoard() {
    const { deviceWidth, deviceHight } = this.data.data
    const { boardTexture } = this

    // 统一缩小十倍避免过大
    const boardGeometry = new THREE.PlaneGeometry(
      deviceWidth / 10,
      deviceHight / 10
    )
    const boardMaterial = new THREE.MeshBasicMaterial({
      map: boardTexture,
      transparent: true
    })

    const boardMesh = new THREE.Mesh(boardGeometry, boardMaterial)
    this.group.add(boardMesh)
  }
  // 更新情报板canvas
  renderInformation() {
    const currentPlay = this.playList[this.currentPlayIndex]
    if (!currentPlay) {
      return
    }
    const { lines } = currentPlay

    const width = this.boardCanvasCtx.canvas.width
    const height = this.boardCanvasCtx.canvas.height

    this.boardCanvasCtx.clearRect(0, 0, width, height)
    this.boardCanvasCtx.fillStyle = 'rgb(0 0 0)'
    this.boardCanvasCtx.fillRect(0, 0, width, height)
    renderLines(lines, this.boardCanvasCtx)
  }
  // 更新情报板纹理
  updateBoardTexture() {
    this.renderInformation()
    this.boardTexture.needsUpdate = true
  }
  // 初始化
  async init() {
    this.createCanvas()
    this.createBoardTexture()
    this.updateBoardTexture()
    this.createBoard()
    this.play()
  }
  // 播放
  play() {
    const currentPlay = this.playList[this.currentPlayIndex]
    if (!currentPlay) {
      return
    }
    const { stay } = currentPlay
    const now = Date.now()
    if (now - this.lastTime > stay * 1000) {
      this.lastTime = Date.now()
      this.currentPlayIndex =
        this.currentPlayIndex + 1 > this.playList.length - 1
          ? 0
          : this.currentPlayIndex + 1
      this.updateBoardTexture()
    }

    // 如果有多个播放列表，则需要循环播放
    if (this.playList.length > 1) {
      requestAnimationFrame(this.play.bind(this))
    }
  }
}
