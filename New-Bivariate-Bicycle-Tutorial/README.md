# Bivariate bicycle tutorial — standalone package

这是 QEC Atlas `bivariate_bicycle` 教程的单条目静态包。它保留该条目的完整浏览路径：

- 稀疏 Landing 与构造器派生的 orienting view；
- 14-step 交互式 Learn；
- Parameters、Formal IR、Decoders、Operations、Realizations、Relations、References 等全部条目 Reference facets；
- 全部条目内 Level-2 derivations；
- Learn ↔ Reference 状态恢复、键盘操作、非颜色编码和窄屏布局。

仓库不包含其他 Atlas 条目，也不包含完整 `exports/site`、Atlas Python 构建系统或全库测试。

## 直接运行

只需要 Python 3 标准库：

```bash
python3 scripts/check_package.py
python3 -m http.server 8000 --bind 127.0.0.1 --directory public
```

然后打开：

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/entries/bivariate_bicycle.html`
- `http://127.0.0.1:8000/tours/bivariate_bicycle.html`

也可以使用：

```bash
make check
make serve
```

MathJax 从公共 CDN 加载；离线时正文和交互仍可访问，但公式不会完成 MathJax 排版。

## 上传到合作者的 GitHub 仓库

把本目录中的内容复制到仓库根目录即可。随附 workflow 会：

1. 用标准库检查包的范围和所有本地链接；
2. 只上传 `public/`；
3. 发布到 GitHub Pages。

在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**，随后 push 到 `main`。workflow 不会上传 `tutorial/` 到 Pages，但源码会保留在 Git 仓库中供审阅。

## 目录

```text
public/                       可直接托管的最小静态站
  entries/bivariate_bicycle* 仅此条目的 Landing 与 Reference
  tours/bivariate_bicycle.html
  foundations/               仅包含本条目实际引用的 CSS-chain foundation
  widgets/                    本教程运行所需的通用组件
tutorial/                     可编辑内容与上游整合材料
  atlas/bivariate_bicycle/    条目原始 YAML、Markdown 与 constructor
  shared/                     本原型使用的通用 CSS/JS 源快照
  upstream-integration.patch  可应用回完整 QEC Atlas 的完整 diff
scripts/check_package.py      无第三方依赖的范围/链接检查
```

`public/` 是经过定向验证的编译快照。若修改 `tutorial/` 中的 YAML 或 Markdown，应在完整 QEC Atlas 环境重新 build，再更新 `public/`；这个最小包不会伪装成独立的 Atlas 编译器。

## 已知边界

- gross 的距离仍是 bounded；本包没有补做 lower-bound certificate。
- 没有 extraction circuit、detector model、circuit distance 或 gross logical action。
- 一部分 bibliography rows 仍明确显示 `metadata pending`。
- `two_bga` 保持 pending relation，并链接到包内精简 Wanted 页面。
- 上游仓库未发现顶层许可证文件；本包没有擅自添加许可证。公开发布前请由项目 owner 确认许可文本。

详见 [PROVENANCE.md](PROVENANCE.md) 和 [manifest.json](manifest.json)。
