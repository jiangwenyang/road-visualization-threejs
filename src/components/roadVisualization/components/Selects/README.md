# Selects 选择框

基于 Element [Select 选择器](https://element.eleme.cn/#/zh-CN/component/select) 进行二次封装，基本用法查看 Element 的文档。

## 基础用法

:::demo

```vue
<template>
  <selects v-model="data" :options="options" />
</template>

<script>
export default {
  data() {
    return {
      options: [
        {
          name: 'option1',
          value: 1
        },
        {
          name: 'option2',
          value: 2
        }
      ],
      data: 1
    }
  }
}
</script>
```

:::

## 分组

:::demo

```vue
<template>
  <selects v-model="data" :options="options" />
</template>

<script>
export default {
  data() {
    return {
      options: [
        {
          label: 'group1',
          children: [
            {
              label: 'group1-option1',
              value: 1
            },
            {
              label: 'group1-option2',
              value: 3
            }
          ]
        },
        {
          label: 'group2',
          children: [
            {
              label: 'group2-option1',
              value: 4
            },
            {
              label: 'group2-option2',
              value: 5
            }
          ]
        }
      ],
      data: 1
    }
  }
}
</script>
```

:::

## Props

> 除以下方法外其他参数将直接透传到 Element Select 组件。
>
> options[n]下的属性也将透传给对应的分组或者下拉选项。

| 参数            | 说明                                          | 类型     | 可选值 | 默认值                   |
| --------------- | --------------------------------------------- | -------- | ------ | ------------------------ |
| options         | 选项数据                                      | Array    | -      | []                       |
| getGroupOptions | 自定义获取分组选项取值，默认获取 options 字段 | Function | -      | option => option.options |
| getLabel        | 自定义 label 取值，默认获取 label 字段        | Function | -      | option => option.label   |
| getValue        | 默认获取 value 取值逻辑，默认获取 value 字段  | Function | -      | option => option.value   |

## Methods

直接暴露的 Element Select 的方法。

| 名称    | 说明     |
| :------ | :------- |
| blur()  | 取消焦点 |
| focus() | 获取焦点 |
