import BaseDevice from './base-device'

import { POSITION_TYPE } from '../constant'

// 摄像头
export default class CameraDevice extends BaseDevice {
  constructor(device, context) {
    super(device, context, [0.2, 0, -1])
  }
  async init() {
    await super.init()
    this.transform()
  }
  // 大小位置调整
  transform() {
    if (this.positionType === POSITION_TYPE.RIGHT) {
      this.group.rotation.y = Math.PI
    }
    this.group.scale.set(0.5, 0.5, 0.5)
  }
}
