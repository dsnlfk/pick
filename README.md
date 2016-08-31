设计师的挑帧工具 - pick
===

安装
---

```
npm install -g electron-packager
npm install
```

生成桌面App
---

```
electron-packager . pick --platform=darwin --arch=x64 --icon=images/yuetai --overwrite --version-string.ProductName=YueTai --app-version=0.0.1
```