<script>
export default {
  name: 'Selects',
  inheritAttrs: false,
  props: {
    // 选项数据
    options: {
      type: Array,
      default: () => []
    },
    props: {
      type: Object,
      default: () => ({
        label: 'label',
        value: 'value',
        children: 'children'
      })
    }
  },
  methods: {
    validateGroupOptions(groupOptions) {
      return !!groupOptions && Array.isArray(groupOptions)
    },
    focus() {
      this.$refs.select.focus()
    },
    blur() {
      this.$refs.select.blur()
    }
  },
  render() {
    const {
      label: labelKey = 'label',
      value: valueKey = 'value',
      children: childrenKey = 'children'
    } = this.props

    // 渲染选项
    const renderOption = (option, index) => {
      const label = option[labelKey]
      const value = option[valueKey]
      const props = { ...option, label, value }
      return <el-option props={props} key={`${label}-${index}`} />
    }
    // 渲染选项组
    const renderOptionGroup = (option, index) => {
      const label = option[labelKey]
      const groupOptions = option[childrenKey]
      const props = { ...option, label }
      if (this.validateGroupOptions(groupOptions)) {
        return (
          <el-option-group props={props} key={`${label}-${index}`}>
            {groupOptions.map(renderOption)}
          </el-option-group>
        )
      } else {
        return renderOption(option, index)
      }
    }

    // 根据值获取当前项数据
    const getOption = val => {
      return this.options.find(item => item[valueKey] === val)
    }

    // 处理change事件
    const handleChange = val => {
      this.$emit('change', val, getOption(val))
    }

    // 处理input事件
    const handleInput = val => {
      this.$emit('input', val, getOption(val))
    }

    const customListeners = {
      ...this.$listeners,
      input: handleInput,
      change: handleChange
    }

    return (
      <el-select props={this.$attrs} on={customListeners} ref="select">
        {this.options.map(renderOptionGroup)}
      </el-select>
    )
  }
}
</script>
