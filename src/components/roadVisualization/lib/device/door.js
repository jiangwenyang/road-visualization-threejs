import BaseDevice from './base-device'

import { POSITION_TYPE } from '../constant'

// 龙门架
export default class DoorDevice extends BaseDevice {
  async init() {
    await super.init()
    this.transform()
  }
  transform() {
    const { roadSize } = this.context
    const scale = 1
    this.group.scale.set(scale, scale, scale)

    if (this.positionType === POSITION_TYPE.LEFT) {
      this.group.position.x = roadSize.x / 4
    } else {
      this.group.position.x = -roadSize.x / 4
    }
  }
}
