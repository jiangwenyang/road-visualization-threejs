# road-visualization-threejs

基于three.js的道路3d可视化，支持多种配置。

## 支持配置

通过组件props options传入，具体支持参考默认对象。

```json
{
  showGUI: isDevelopment, // 是否显示GUI
  showHelper: false && isDevelopment, // 是否显示辅助线
  showStats: isDevelopment, // 是否显示统计信息
  useMapControls: false, // 是否使用 MapControls 控件
  shadow: false, // 是否显示阴影
  randomCar: false, // 是否随机生成车辆
  randomCarMax: 5 // 随机生成车辆数量
}
```

## 预览

live demo: <https://road-visualization-threejs.vercel.app/>

![ScS99v](https://raw.githubusercontent.com/jiangwenyang/graphbed/master/uPic/ScS99v.jpg)

![lRgqXB](https://raw.githubusercontent.com/jiangwenyang/graphbed/master/uPic/lRgqXB.jpg)

![o5VzTI](https://raw.githubusercontent.com/jiangwenyang/graphbed/master/uPic/o5VzTI.jpg)

![DwPGp8](https://raw.githubusercontent.com/jiangwenyang/graphbed/master/uPic/DwPGp8.jpg)

## 开发

```bash
pnpm install
```

```bash
pnpm run serve
```

## TIPS

项目加载的光照HDR文件比较大，可能耗时较长。可以改为其他文件或者动态加载。查找rooitou_park_4k.hdr进行替换即可。
