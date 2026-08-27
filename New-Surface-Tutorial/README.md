# Surface Tutorial — standalone package

这是 QEC Atlas `atlas/surface` 教程的单条目、静态、GitHub Pages 可直接托管版本。
它不是完整 Atlas 网站，也不包含其余 128 个条目的生成页面。

## 包含内容

- Surface landing 与完整 Reference 子树
- 7 章、15 步的交互式 Learn route
- Surface HGP advanced tour
- Learn 直接调用的共享 foundations 与 Wanted 页面
- 运行这些页面所需的 CSS、通用 widgets 与 MathJax 配置
- `authoring/` 下的可编辑 Lesson Brief、Lesson YAML、证据说明和 circuit artifact
- `patches/` 下相对 Atlas 基线的完整源代码 diff

跨到 Toric、HGP 等其他 Atlas 条目的链接不会产生 404，而会进入明确的
`scope.html` 包边界说明。arXiv、MathJax 等外部链接保持原样。

## 本地运行

只需要 Python 3，无需安装 Atlas 或前端依赖：

```bash
python3 scripts/check_package.py
python3 scripts/serve.py --port 8879
```

然后打开 <http://127.0.0.1:8879/>。

不要直接双击 HTML 使用 `file://`：浏览器对 history/sessionStorage 的行为不同，
也无法代表 GitHub Pages 的真实路径语义。

## GitHub Pages

将本目录内容放在合作者仓库根目录，在仓库设置中选择：

1. **Settings → Pages**
2. **Deploy from a branch**
3. 选择目标分支与 **/(root)**

所有站内 URL 都是项目子路径可移植的相对链接，因此同时支持：

- `https://<owner>.github.io/<repo>/`
- 自定义域名
- 本地任意端口的静态 HTTP server

## 更新静态包

先在隔离的 QEC Atlas 副本中生成完整 `exports/site`，再运行：

```bash
python3 scripts/build_package.py \
  --site /path/to/qec-atlas/exports/site \
  --atlas-root /path/to/qec-atlas \
  --patch /path/to/surface-prototype.diff \
  --baseline <atlas-commit-sha> \
  --dest .
python3 scripts/check_package.py
```

提取器采用显式 allow-list，并在生成后重写超出包边界的本地链接；不会复制完整
`exports/site`。`package-manifest.json` 记录基线、源补丁哈希和每个交付文件的哈希。
