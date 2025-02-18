import BaseDevice from './base-device'

import { isObjectInView } from '../helpers'
import { getModelPath } from '../utils'
import { POSITION_TYPE, INFORMATION_BOARD_DEVICE_TYPE } from '../constant'

import Information from './information'

// 情报板
export default class InformationBoardDevice extends BaseDevice {
  constructor(device, context) {
    super(device, context, [0, 0, -3])
    this.modelPath = getModelPath(device.type, device.data.deviceType)
    this.playList = []
    this.information = null
    this.requestAnimationFrameId = null
    this.informationFether = context.services.informationFether || (() => {})
  }
  async init() {
    await super.init()
    this.transform()

    this.initInfomation()
  }

  // 模型大小位置调整
  transform() {
    let scale = 0.255

    switch (Number(this.data.data.deviceType)) {
      // F板
      case INFORMATION_BOARD_DEVICE_TYPE['门架H']:
        scale = 0.98

        this.updatePosition({
          x: this.positionType === POSITION_TYPE.RIGHT ? this.x - 3 : this.x + 3
        })

        break
      default:
        if (this.positionType === POSITION_TYPE.RIGHT) {
          this.group.rotation.y = Math.PI
        }
        break
    }

    this.group.scale.set(scale, scale, scale)

    // TODO: 测试用
    // this.updatePosition({ z: 0 });
  }

  // 初始化情报板信息
  async initInfomation() {
    if (isObjectInView(this.group, this.context.camera)) {
      await this.getPlayList()
      this.createInfomation()

      this.requestAnimationFrameId &&
        cancelAnimationFrame(this.requestAnimationFrameId)
      this.requestAnimationFrameId = null
    } else {
      this.requestAnimationFrameId = requestAnimationFrame(() => {
        this.initInfomation()
      })
    }
  }

  // 获取播放列表
  async getPlayList() {
    if (this.hasFetched) {
      return
    }
    const res = await this.informationFether({
      id: this.data.data.id
    })
    this.playList = res && res.data ? res.data : []
    this.hasFetched = true
  }

  // 创建情报板信息
  createInfomation() {
    if (this.information) {
      return
    }
    if (!(this.playList && this.playList.length > 0)) {
      return
    }
    this.information = new Information(this.data, this.playList, this.context)
    this.group.add(this.information.group)
    this.transformInfomation(this.information.group)
  }

  // 转换情报板信息位置大小
  transformInfomation(informationGroup) {
    // 根据不同设备类型调整情报板展示缩放及位置
    switch (Number(this.data.data.deviceType)) {
      case INFORMATION_BOARD_DEVICE_TYPE['门架H']:
        informationGroup.scale.set(0.18, 0.18, 0.18)
        informationGroup.position.y = 4.12
        if (this.positionType === POSITION_TYPE.RIGHT) {
          informationGroup.position.z = 0.3
        } else {
          informationGroup.rotation.y = Math.PI
          informationGroup.position.z = -0.3
        }
        break
      default:
        // 大小位置调整
        informationGroup.position.y = 9.5
        informationGroup.scale.set(0.5, 0.5, 0.5)
        informationGroup.rotation.y = Math.PI

        if (this.positionType === POSITION_TYPE.RIGHT) {
          informationGroup.position.z = -0.3
        } else {
          informationGroup.position.z = -0.5
        }
        break
    }
  }
}
