/**
 * 转化桩号格式
 * K1234+567 => 1234.567
 * @param {String} stakeText 桩号
 * @return {Number}
 */
export function parseStake(stakeText) {
  stakeText = stakeText && String(stakeText).trim()
  if (!stakeText) {
    return null
  }
  return Number(stakeText.replace(/[a-z]+/gi, '').replace('+', '.'))
}

/**
 * 转化桩号格式
 * 1234.567 => K1234+567
 * @param {String|Number} stake 桩号
 * @return {String}
 */
export function formatStake(stake) {
  if (!stake && stake !== 0) {
    return ''
  }
  const tmpArr = String(stake)
    .replace(/[a-z]+/gi, '')
    .split('.')
  let decimalPart = tmpArr[1] || ''
  if (!decimalPart) {
    return `K${tmpArr[0]}`
  }
  while (decimalPart.length < 3) {
    decimalPart += '0'
  }
  return `K${tmpArr[0]}+${decimalPart}`
}

// 解析桩号
const parsePile = pile => {
  if (!pile) {
    return ['', '']
  }
  // eslint-disable-next-line prefer-const
  let [kilometer, hectometer] = String(pile).split('.')

  if (hectometer && hectometer.length < 3) {
    hectometer = hectometer.padEnd(3, '0')
  }

  return [
    kilometer ? parseInt(kilometer) : '',
    hectometer ? parseInt(hectometer) : ''
  ]
}

// 获取桩号
const getPile = (kilometer, hectometer) => {
  if (hectometer && hectometer.length < 3) {
    hectometer = hectometer.padStart(3, '0')
  }
  return Number([kilometer, hectometer].filter(Boolean).join('.'))
}

function mapValueToRange(value, oldMin, oldMax, newMin, newMax) {
  // 防止除以零的情况
  if (oldMin === oldMax) {
    throw new Error('oldMin and oldMax cannot be the same value')
  }

  // 处理 min > max 的情况，确保计算始终为正方向
  const reverseOldRange = oldMin > oldMax

  // 如果旧范围是反向的（oldMin > oldMax），我们需要翻转计算逻辑
  if (reverseOldRange) {
    [oldMin, oldMax] = [oldMax, oldMin] // 交换 oldMin 和 oldMax
  }

  // 线性插值公式
  const result =
    ((value - oldMin) / (oldMax - oldMin)) * (newMax - newMin) + newMin

  // 如果原始范围是反向的，返回结果需要反转
  return reverseOldRange ? newMax - (result - newMin) : result
}

// 反向映射函数：将 0-10 范围的值转换回原始范围
function mapValueBackToRange(value, newMin, newMax, oldMin, oldMax) {
  // 防止除以零的情况
  if (newMin === newMax) {
    throw new Error('newMin and newMax cannot be the same value')
  }

  // 处理 min > max 的情况
  const reverseOldRange = oldMin > oldMax

  if (reverseOldRange) {
    [oldMin, oldMax] = [oldMax, oldMin] // 交换 oldMin 和 oldMax
  }

  // 反向线性插值公式
  const result =
    ((value - newMin) / (newMax - newMin)) * (oldMax - oldMin) + oldMin

  // 如果原始范围是反向的，返回结果需要反转
  return reverseOldRange ? oldMax - (result - oldMin) : result
}

// 将任意范围的值转换到 0 到 10 的范围
function convertToRange(value, oldMin, oldMax, range = 10) {
  return mapValueToRange(value, oldMin, oldMax, 0, range)
}

// 将 0-10 范围的值转换回任意的原始范围
function convertBackToOriginalRange(value, oldMin, oldMax, range = 10) {
  return mapValueBackToRange(value, 0, range, oldMin, oldMax).toFixed(3)
}

export { parsePile, getPile, convertToRange, convertBackToOriginalRange }
