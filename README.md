![Inpaint-web](./media/cover.png)

<div align="center">
  
# Inpaint-web

Un outil gratuit et open-source d’inpainting et de mise à l’échelle d’images alimenté par webgpu et wasm sur le navigateur.
Cet AI permet de modifier une image via une interface Web. En utilisant les ressources du poste Client.
Compatible mobile, pc et tablette. Cette solution exploite directement le CPU et le GPU depuis un navigateur.

A free and open-source inpainting & image-upscaling tool powered by webgpu and wasm on the browser.

基于 Webgpu 技术和 wasm 技术的免费开源 inpainting & image-upscaling 工具, 纯浏览器端实现。

</div>

## Inpaint（图片修复）

https://github.com/lxfater/inpaint-web/assets/22794120/bcad4812-02ae-48bb-9e84-94dfeb7234f5

## Super-Resolution（图片高清化）

https://github.com/lxfater/inpaint-web/assets/22794120/3a8d894f-9749-4685-b947-8b5f15c9cf38

## Models

Super-Face :
https://github.com/yangxy/GPEN
2xHFA2kAVCSRFormer_light_16 :
https://github.com/Phhofm/models

Ref & Info :
https://github.com/facefusion/facefusion-assets

## Demo link

Demo link:https://inpaintweb.lxfater.com/

## Project Roadmap

### fr

- [x] Historique des modifications d'images
- [x] Optimiser le modèle
- [x] Intégrer le post-traitement dans le modèle
- [x] Mise à l'échelle de l'image
- [x] Prise en charge en français, allemand et espagnol
- [x] Ajout de Super Face
- [ ] Intégrez tout segment pour une sélection et une suppression rapides dans les images
- [ ] Intégrer la diffusion stable pour le remplacement de l'image
- [ ] Meilleure interface utilisateur

### en

- [x] Image Modification History
- [x] Optimize Model
- [x] Integrate Post-Processing into the Model
- [x] Image-upscaling
- [x] French, German, and Spanish support
- [x] Add Super Face
- [ ] Integrate Segment Anything for Quick Selection and Removal in Images
- [ ] Integrate Stable Diffusion for Image Replacement
- [ ] Better UI

### cn

- [x] 图像修改历史
- [x] 优化模型
- [x] 后处理集成于模型中
- [x] 超分辨率
- [x] 支持法语、德语和西班牙语
- [x] 添加了超级面孔
- [ ] 接入 Segment Anything，实现快速选择和去除图像
- [ ] 接入 stable diffusion，实现图像替换
- [ ] 更好的界面

## Requis Git & NPM

`sudo apt install git-all`
`sudo apt install npm`

## Setup

`npm install`

## Development

`npm run start`

Now you should have Inpaint running locally and should be able to visit http://localhost:5173 or http://127.0.0.1:5173

## Contributors

<a href="https://github.com/lxfater/inpaint-web/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=lxfater/inpaint-web" />
</a>

## Translations via [fink editor](https://inlang.com/m/tdozzpar/app-inlang-editor)

[![inlang status badge](https://inlang.com/badge?url=github.com/lxfater/inpaint-web)](https://inlang.com/editor/github.com/lxfater/inpaint-web?ref=badge)

## About me

### Wechat

<div align="left">
    <span>联系我之前说明来意，我创业了，时间很宝贵。</span>
    <img src="https://raw.githubusercontent.com/lxfater/inpaint-web/main/media/wechat.jpg" style="width: 200px; display: inline-block;">
</div>

### Contenu en Francais

Pour les mises à jour et les discussions en Francais, suivez-nous sur Instagram
[![Instagram Follow N3oray](https://raw.githubusercontent.com/N3oRay/inpaint-web/main/media/instagram-s.png)](https://www.instagram.com/n3oray/)

### English Content

For updates and discussions in English, follow me on Twitter:
[![Twitter Follow](https://img.shields.io/twitter/follow/rules4thing?style=social)](https://twitter.com/rules4thing)

### 中文内容

获取中文更新和讨论，请关注我的 Twitter:
[![Twitter Follow](https://img.shields.io/twitter/follow/lxfater?style=social)](https://twitter.com/lxfater)

## Acknowledgements

Frontend code are modified from [cleanup.pictures](https://github.com/initml/cleanup.pictures), You can experience their
great online services [here](https://cleanup.pictures/).

Model: https://github.com/Picsart-AI-Research/MI-GAN

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=lxfater/inpaint-web&type=Date)](https://star-history.com/#lxfater/inpaint-web&Date)


## Other Projects by the Author (作者的其他项目)

### 中文

查看我的其他项目：

- [Demoget](https://www.demoget.com/zh)：免费的自动放大，鼠标轨迹优化的录屏软件。
- [tinyeraser](https://www.tinyeraser.com/zh)：免费，批量，快速，一键换背景。

### English

Check out my other projects:

- [Demoget](https://www.demoget.com/en): Free screen recording software with auto-zoom and mouse trajectory optimization.
- [tinyeraser](https://www.tinyeraser.com/en): Free, batch, fast, one-click background replacement.

