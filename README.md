# Harness Notes

namanegi 的 Harness Engineering 研究笔记。

阅读站点：https://namanegi.github.io/harness-notes/

文章与页面源位于 `content/`，公开汇总位于 `assets/`。本仓库不包含实验凭据、原始模型请求或私有运行轨迹。各研究保留自己的方法、样本和限制。

本地构建：

```sh
python -m pip install -r requirements.txt
python build.py
python -m http.server 8080 --directory ..
```

预览 `/harness-notes/`。生成的 HTML 随源文件提交；GitHub Pages 从 main 根目录发布，无服务端或额外构建流程。
