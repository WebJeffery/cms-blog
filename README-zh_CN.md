<div align="center"><a name="readme-top"></a>

<a href="https://gaoredu.com" title="ReactPress"><img height="180" src="./public/logo.png">
</a>

[![ReactPress](./public/poster.png)](https://gaoredu.com)

## 项目简介

`ReactPress` 是使用React开发的开源发布平台，用户可以在支持React和MySQL数据库的服务器上架设属于自己的博客、网站。也可以把 `ReactPress` 当作一个内容管理系统（CMS）来使用。

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/fecommunity/reactpress/blob/master/LICENSE)[![(Runtime) Build and Test](https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml/badge.svg)](https://github.com/fecommunity/reactpress/blob/master/package.json) [![(Compiler) TypeScript](https://github.com/facebook/react/actions/workflows/compiler_typescript.yml/badge.svg?branch=main)](https://github.com/fecommunity/reactpress/blob/master/client/tsconfig.json) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/fecommunity/reactpress/pulls)

[报告问题](https://github.com/fecommunity/reactpress/issues) · [参与共建](https://github.com/fecommunity/reactpress/pulls) · [English](./README.md) · 中文

**内容管理**

[![内容管理](./public/admin.png)](https://blog.gaoredu.com)

**主页**

[![Home Page](./public/home.png)](https://blog.gaoredu.com)

**文章分类**

[![文章分类](./public/ipad.png)](https://blog.gaoredu.com)

**移动端**

[![Mobile Phone](./public/mobile.png)](https://blog.gaoredu.com)


</div>

## 🆚 框架对比

以下是`ReactPress`、`WordPress` 和 `VuePress` 三者的对比：

| 项目 | ReactPress | WordPress | VuePress |
| --- | --- | --- | --- |
| **技术栈** | React+NextJS+MySQL+NestJS | PHP+MySQL | Vue.js |
| **类型** | 开源发布平台/CMS | 开源发布平台/CMS | 静态网站生成器/文档工具 |
| **前后端分离** | 支持 | 不支持（传统方式） | 支持 |
| **组件化开发** | 支持 | 有限支持（通过插件和主题） | 支持 |
| **性能优化** | 虚拟DOM、代码分割、懒加载 | 依赖插件优化 | 静态页面生成，性能优越 |
| **SEO性能** | 出色（SSR支持） | 良好 | 优秀（静态页面） |
| **定制性** | 高（完全自定义主题和样式） | 高（通过插件和主题） | 中等（主题和组件定制） |
| **扩展性** | 强（API接口、前后端独立扩展） | 强（插件扩展） | 中等（插件和主题扩展） |
| **用户界面** | 现代化，基于React的组件化设计 | 用户友好的后台界面 | 简约，为技术文档优化 |
| **安全性** | 依赖框架和数据库的安全性 | 依赖插件和主题的更新与维护 | 静态网站，安全性较高 |
| **适用场景** | 复杂功能、高并发访问、SEO优化需求 | 快速搭建网站、内容发布和管理 | 技术文档、静态博客 |
| **用户群体** | 开发者、技术团队、个人博客、小型企业 | 个人博客、小型企业、初创公司 | 技术文档编写者、开发者 |
| **社区支持** | 活跃且不断成长 | 非常活跃，拥有庞大的用户群体 | Vue.js社区支持 |

## ✨ 特性

- 📦 技术栈：基于 `React` + `NextJS` + `MySQL 5.7` + `NestJS` 构建
- 🌈 组件化：基于 `antd 5.20` 最新版的交互语言和视觉风格
- 🌍 国际化：支持中英文切换，国际化配置管理能力
- 🌞 黑白主题：支持亮色和暗黑模式主题自由切换
- 🖌️ 创作管理：内置 `MarkDown` 编辑器，支持文章写文章、分类目录管理，标签管理
- 📃 页面管理：支持自定义新页面
- 💬 评论管理：支持内容评论管理
- 📷️ 媒体管理：支持文件本地上传和 `OSS` 文件上传
- 📱 移动端：完美适配移动端H5页面
- ...

## 🔥 在线示例

[ReactPress Demo](https://blog.gaoredu.com/)

## ⌨️ 本地开发

### 环境准备
```bash
$ git clone --depth=1 https://github.com/fecommunity/reactpress.git
$ cd reactpress
$ npm i -g pnpm
$ pnpm i
```

### 配置文件

项目启动后会加载根目录下的 `.env` 配置文件，请确保MySQL数据库服务和下面的配置保持一致，并提前创建好 `reactpress` 数据库

```js
DB_HOST=127.0.0.1 // 数据库地址
DB_PORT=3306 // 端口
DB_USER=reactpress // 用户名
DB_PASSWD=reactpress // 密码
DB_DATABASE=reactpress // 数据库
```

环境准备好后，执行启动命令：

```bash
$ pnpm run dev
```

打开浏览器访问 http://127.0.0.1:3001


## 🔗 链接

- [首页](https://github.com/fecommunity/reactpress)
- [高热度网](https://gaoredu.com)
- [报告问题](https://github.com/fecommunity/reactpress/issues)
- [参与共建](https://github.com/fecommunity/reactpress/pulls) 
- [next.js 源码](https://github.com/vercel/next.js)
- [nest.js 源码](https://github.com/nestjs/nest)


> 强烈推荐阅读 [《提问的智慧》](https://github.com/ryanhanwu/How-To-Ask-Questions-The-Smart-Way)、[《如何向开源社区提问题》](https://github.com/seajs/seajs/issues/545) 和 [《如何有效地报告 Bug》](http://www.chiark.greenend.org.uk/%7Esgtatham/bugs-cn.html)、[《如何向开源项目提交无法解答的问题》](https://zhuanlan.zhihu.com/p/25795393)，更好的问题更容易获得帮助。

## 👥 社区互助

如果您在使用的过程中碰到问题，可以通过下面几个途径寻求帮助，同时我们也鼓励资深用户通过下面的途径给新人提供帮助。
<div>
<a href="https://gaoredu.com" title="高热度网"><img height="200" src="https://www.gaoredu.com/wp-content/uploads/2024/08/WechatIMG23.jpg"></a>
</div>

通过 WeChat 联系，可通过搜素微信号 `red_tea_v2` 或扫码加入 ，并备注来源。

通过 GitHub Discussions 提问时，建议使用 `Q&A` 标签。

通过 Stack Overflow 或者 Segment Fault 提问时，建议加上 `reactpress` 标签。


1. [GitHub Discussions](https://github.com/ant-design/ant-design/discussions)
2. [Stack Overflow](http://stackoverflow.com/questions/tagged/antd)（英文）
3. [Segment Fault](https://segmentfault.com/t/antd)（中文）

Email: admin@gaoredu.com

## ❤️ 致谢

ReactPress 项目深受以下开源项目的启发和帮助：

- **[fantasticit]** - **[wipi]** - [[https://github.com/fantasticit/wipi](https://github.com/fantasticit/wipi)]

- **[Lrunlin]** - **[blog]** - [[GitHub Repository Link 2](https://github.com/Lrunlin/blog)]

- **[biaochenxuying]** - **[blog-react]** - [[https://github.com/biaochenxuying/blog-react](https://github.com/biaochenxuying/blog-react)]

- **[MrXujiang]** - **[next-admin]** - [[https://github.com/MrXujiang/next-admin](https://github.com/MrXujiang/next-admin)]

- **[lfb]** - **[nodejs-koa-blog]** - [[https://github.com/lfb/nodejs-koa-blog](https://github.com/lfb/nodejs-koa-blog)]

……

我们衷心感谢这些项目的作者和贡献者们！正是有了你们的努力和付出，才有了 ReactPress 项目的今天。


## ✨ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=fecommunity/reactpress&type=Date)](https://star-history.com/#fecommunity/reactpress&Date)