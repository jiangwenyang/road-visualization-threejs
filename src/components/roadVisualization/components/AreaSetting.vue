<template>
  <el-form
    ref="form"
    :rules="formRules"
    label-position="top"
    size="mini"
    :model="model"
    label-suffix="："
    :hide-required-asterisk="true"
  >
    <el-form-item label="路段" prop="roadId">
      <Selects
        v-model="model.roadId"
        :options="roadListOptions"
        :props="{ label: 'label', value: 'id' }"
        style="width: 100%"
      />
    </el-form-item>
    <el-form-item label="桩号范围" prop="startKilometer">
      <div class="row">
        <div class="col">
          <el-input
            v-model="model.startKilometer"
            class="input"
            :min="currentRoad ? Math.floor(currentRoad.startStake) : 0"
          >
            <i slot="prefix" class="el-input__prefix">
              K
            </i>
          </el-input>
          <span>+</span>
          <el-input v-model="model.startHectometer" class="input"> </el-input>
        </div>

        <span class="split">-</span>

        <div class="col">
          <el-input v-model="model.endKilometer" class="input">
            <i slot="prefix" class="el-input__prefix">
              K
            </i>
          </el-input>
          <span>+</span>
          <el-input v-model="model.endHectometer" class="input"> </el-input>
        </div>
      </div>
    </el-form-item>
    <div class="footer">
      <el-button size="mini" type="primary" @click="handleSubmit">
        确定
      </el-button>
    </div>
  </el-form>
</template>

<script>
import Selects from './Selects'
import { parsePile, getPile, formatStake } from '../utils'
export default {
  name: 'AreaSetting',
  components: {
    Selects
  },
  props: {
    value: {
      type: Object,
      default: () => {}
    },
    roadList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      model: this.getDefaultModel(),
      formRules: {
        roadId: [
          {
            required: true,
            message: '请选择路段',
            trigger: 'change'
          }
        ],
        startKilometer: [
          {
            trigger: 'change',
            validator: this.validatePile
          }
        ]
      }
    }
  },
  computed: {
    roadListOptions() {
      return this.roadList.map(item => {
        const { startStake, endStake } = item
        return {
          label: `${item.expressWayName} (${
            startStake ? formatStake(startStake) : ''
          } - ${endStake ? formatStake(endStake) : ''})`,
          id: item.id
        }
      })
    },
    currentRoad() {
      return this.roadList.find(item => item.id === this.model.roadId)
    }
  },
  watch: {
    value() {
      this.model = this.getDefaultModel()
    },
    currentRoad(val) {
      if (val) {
        const { startStake, endStake } = val
        const {
          startKilometer,
          startHectometer,
          endKilometer,
          endHectometer
        } = this.getPile(startStake, endStake)

        this.model.startKilometer = startKilometer
        this.model.startHectometer = startHectometer
        this.model.endKilometer = endKilometer
        this.model.endHectometer = endHectometer
      }
    }
  },
  methods: {
    parsePile,
    validatePile(rule, value, callback) {
      const {
        startKilometer,
        startHectometer,
        endKilometer,
        endHectometer
      } = this.model

      const startPile = getPile(startKilometer, startHectometer)
      const endPile = getPile(endKilometer, endHectometer)

      const { startStake, endStake } = this.currentRoad || {}

      if (startStake && startPile < startStake) {
        callback(new Error(`当前路段最小桩号为${formatStake(startStake)}`))
        return
      }

      if (endStake && endPile > endStake) {
        callback(new Error(`当前路段最大桩号为${formatStake(endStake)}`))
        return
      }

      if (startPile < 0 || endPile < 0) {
        callback(new Error('桩号不能小于0'))
        return
      }

      if (Math.abs(startPile - endPile) < 0) {
        callback(new Error('桩号范围不能小于0'))
        return
      }

      callback()
    },
    getPile(startStake, endStake) {
      const [startKilometer, startHectometer] = parsePile(startStake)
      const [endKilometer, endHectometer] = parsePile(endStake)
      return {
        startKilometer,
        startHectometer,
        endKilometer,
        endHectometer
      }
    },
    getDefaultModel() {
      const { roadId, startPile, endPile } = this.value
      return {
        roadId,
        ...this.getPile(startPile, endPile)
      }
    },
    handleSubmit() {
      this.$refs.form.validate(valid => {
        if (valid) {
          const {
            roadId,
            startKilometer,
            startHectometer,
            endKilometer,
            endHectometer
          } = this.model
          const model = {
            roadId,
            startPile: getPile(startKilometer, startHectometer),
            endPile: getPile(endKilometer, endHectometer)
          }
          this.$emit('input', model)
          this.$emit('close')
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.footer {
  text-align: center;
}
.row,
.col {
  display: flex;
  align-items: center;
}
.row {
  gap: 10px;
}
.col {
  flex: 1;
  gap: 6px;
}
.input {
  flex: 1;
}
</style>
