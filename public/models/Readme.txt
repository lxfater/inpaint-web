 *The following are not models I had trained, but rather interpolations I had created, they are available on my [repo](https://github.com/phhofm/models) and can be tried out locally with chaiNNer:*  
    4xLSDIRplus (4xLSDIRplusC + 4xLSDIRplusR)
    4xLSDIRCompact3 (4xLSDIRCompactC3 + 4xLSDIRCompactR3)  
    4xLSDIRCompact2 (4xLSDIRCompactC2 + 4xLSDIRCompactR2)  
    4xInt-Ultracri (UltraSharp + Remacri)  
    4xInt-Superscri (Superscale + Remacri)  
    4xInt-Siacri(Siax + Remacri)  
    4xInt-RemDF2K (Remacri + RealSR_DF2K_JPEG)  
    4xInt-RemArt (Remacri + VolArt)  
    4xInt-RemAnime (Remacri + AnimeSharp)  
    4xInt-RemacRestore (Remacri + UltraMix_Restore)  
    4xInt-AnimeArt (AnimeSharp + VolArt)  
    2xInt-LD-AnimeJaNai (LD-Anime + AnimeJaNai)  
    """)
---------------------------------------------------------------

4xLSDIRCompactC3

Name: 4xLSDIRCompactC3
License: CC BY 4.0
Model Architecture: SRVGG
Scale: 4
Purpose: Upscale jpg compressed photos to x4 their size
Iterations: 230’000
batch_size: Variable(1-20)
HR_size: 256
Dataset: LSDIR
Dataset_size: 8000-84991 hr& lr
OTF Training No
Pretrained_Model_G: 4xLSDIRCompact
Description: Able to handle JPG compression (30-100).
Total Training Time: 33+ hours



4xLSDIRCompactN3

Name: 4xLSDIRCompactN3
License: CC BY 4.0
Model Architecture: SRVGG
Scale: 4
Purpose: Upscale good quality input photos to x4 their size
Iterations: 185'000
batch_size: Variable(1-10)
HR_size: 256
Dataset: LSDIR
Dataset_size: 84991 hr + 84991 lr
OTF Training No
Pretrained_Model_G: 4x_Compact_Pretrain.pth
Description: The original 4xLSDIRCompact a bit more trained, cannot handle degradations but should keep most details in comparison to C3 and R3.
Total Training Time: 32+ hours



4xLSDIRCompactR3

Name: 4xLSDIRCompactR3
License: CC BY 4.0
Model Architecture: SRVGG
Scale: 4
Purpose: Upscale (degraded) photos to x4 their size
Iterations: 192’500
batch_size: Variable(1-45)
HR_size: 256
Dataset: LSDIR
Dataset_size: 10000-84991 hr& lr
OTF Training Yes
Pretrained_Model_G: 4xLSDIRCompact.pth
Description: Trained on synthetic data, meant to handle more degradations. Can handle blur, noise and compression.
Total Training Time: 86+ hours

---------------------------------------


Origine File 
https://github.com/Phhofm/models/raw/main/2xHFA2kAVCSRFormer_light/onnx/2xHFA2kAVCSRFormer_light_16_onnxsim_fp32.onnx
https://github.com/Phhofm/models/raw/main/2xHFA2kAVCSRFormer_light/onnx/2xHFA2kAVCSRFormer_light_64_onnxsim_fp32.onnx

-------------------------


Models

This is a repo for me to publish my self trained single image super resolution (sisr) models.

Update 08.04.2024:
I am currently in the process of updating this repo by creating a github release on this repo for each released model, check out the Released Section in this partly updated README. Then I can also remove most file folders in this repo.

As an example, you can have a look at my 4xRealWebPhoto_v3_atd release which you can try out currently with chaiNNer nightly, or then the dat2 model version of this with normal chaiNNer.

For convenience, you can download a zip file of all my 111 released models (mostly as safetensors files) here.

After releasing all models here as github releases, I will also release them on Hugging Face so they are automatically downloadable if used in an application, or used in a huggingface space for example, which i had made two just to showcase, youll find them in the link.

I recommend running these models locally with chaiNNer. I made a youtube video on how to set up and use chaiNNer. Btw they externalized their upscaling code into the Spandrel Library

Results for some of these can be compared on my interactive visual comparison website, but this site is currently not up-to-date since it became a 70GB repo so automatic deployment became unfeasible and updating a bit more cumbersome, maybe I will be able in the future to reduce it a bit with BFG Repo-Cleaner.

I also made some youtube videos you might find interesting, like this one.

Find more sisr models trained by the community in openmodeldb.

Here also a link to the Enhance Everything! Discord Server where I had been active.

Also this weekend I played around with a comfyui workflow using SUPIR, I just uploaded the result in the SUPIR folder. Basically diffusion based upscalers in general have the tendency to produce output that is pretty different to an input image as to resemble more an 'img2img enlarger' process than super resolving. My play around was to try to use the consistency of transformers as the upscale, and then SUPIR in the second step but with settings that enforce consistency. Use case would be for very degraded input image where my transformer model hits a limit. Examples and readme and workflow in the folder.
Released (sorted by new)

-- Newly Updated Section --

All my 111 released models as safetensors files in a zip file

Model releases sorted by date, linked to their github release:

04.05.2024 - 4xTextures_GTAV_rgt-s
02.05.2024 - 4xRealWebPhoto_v4_drct-l
28.04.2024 - 4xDRCT-mssim-pretrains
10.04.2024 - 4xpix_span_pretrain & 4xmssim_span_pretrain
04.04.2024 - 4xRealWebPhoto_v4_dat2 4x upscaling photos downloaded from the web, handles jpg&webp compression, some realistic noise and some lens blur, DAT2 model.
25.03.2024 - Ludvae200 1x realistic noise degradation model for training dataset creation, LUD-VAE model.
22.03.2024 - 4xRealWebPhoto_v3_atd 4x upscaling photos downloaded from the web, handles jpg&webp compression, some realistic noise and some lens blur, ATD model - recommended to try out ;)
22.03.2024 - 4xNomos8k_atd_jpg 4x photo upscaler, handles jpg compression, preserves noise, ATD model.
10.03.2024 - 4xRealWebPhoto_v2_rgt_s 4x upscaling photos downloaded from the web, handles jpg&webp compression, some realistic noise and some lens blur, RGT-S model.
20.02.2024 - 4xNomosUni_rgt_multijpg 4x universal DoF preserving upscaler, handles jpg compression, RGT model.
16.02.2024 - 4xNomosUni_rgt_s_multijpg 4x universal DoF preserving upscaler, handles jpg compression, RGT-S model.
12.02.2024 - 2xEvangelion_dat2 2x upscaler for the Community Evangelion Ep16 upscale project, DAT2 model.
08.02.2024 2xEvangelion_omnisr 2x upscaler for the Community Evangelion Ep16 upscale project, OmniSR model.
04.02.2024 - 2xEvangelion_compact 2x upscaler for the Community Evangelion Ep16 upscale project, SRVGGNetCompact model.
28.01.2024 - 4xNomosUniDAT2_multijpg_ldl & 4xNomosUniDAT2_multijpg_ldl_sharp 4x universal DoF preserving upscaler, handles jpg compression, DAT2 models.
27.01.2024 - 1xExposureCorrection_compact & 1xOverExposureCorrection_compact & 1xUnderExposureCorrection_compact 1x Exposure correction, SRVGGNetCompact models.
13.01.2024 - 2xNomosUni_span_multijpg_ldl 2x fast universal DoF preserving upscaler, handles jpg compression, SPAN model.
11.01.2024 - 2xNomosUni_compact_multijpg_ldl
11.01.2024 - 2xNomosUni_compact_otf_medium
04.01.2024 - 4xHFA2k_VCISR_GRLGAN_ep200
04.01.2024 - 2xHFA2kShallowESRGAN
26.12.2024 - 2xHFA2kSPAN
26.12.2024 - 2xHFA2k_LUDVAE_SPAN
26.12.2024 - 2xHFA2k_LUDVAE_compact
26.12.2024 - 2xHFA2k_compact_multijpg
26.12.2024 - 2xHFA2kReal-CUGAN
26.12.2024 - 2xHFA2kOmniSR
26.12.2024 - 2xHFA2kSwinIR-S
20.12.2023 - 2xNomosUni_esrgan_multijpg
13.12.2023 - 2xNomosUni_span_multijpg
13.12.2023 - 2xNomosUni_compact_multijpg
13.12.2023 - 4xTextureDAT2_otf
09.12.2023 - 4xNomosUni_span_multijpg
09.12.2023 - 4xNomos8k_span_otf_weak & 4xNomos8k_span_otf_medium & 4xNomos8k_span_otf_strong (because of resave training most of these are undertrained)
01.11.2023 - 4xLexicaDAT2_otf
01.11.2023 - 4xNomos8kHAT-L_otf
05.10.2023 - 4xNomos8kHAT-L_bokeh_jpg
23.09.2023 - 4xNomosUniDAT_otf
14.09.2023 - 4xNomosUniDAT_bokeh_jpg
10.09.2023 - 4xNomosUniDAT2_box
10.09.2023 - 4xLSDIRDAT
10.09.2023 - 4xReal_SSDIR_DAT_GAN
10.09.2023 - 4xSSDIRDAT
02.09.2023 - 4xFaceUpDAT & 4xFaceUpLDAT & 4xFaceUpSharpDAT & 4xFaceUpSharpLDAT
25.08.2023 - 4xFFHQDAT & 4xFFHQLDAT
13.08.2023 - 4xNomos8kDAT
02.08.2023 - 1xDeJPG_SRFormer_light & 1xDeJPG_OmniSR & 1xDeJPG_HAT
11.07.2023 - 2xHFA2kAVCSRFormer_light
30.06.2023 - 4xNomos8kSCHAT-L & 4xNomos8kSCHAT-S
26.06.2023 - 4xNomos8kSCSRFormer
18.06.2023 - 2xHFA2kAVCCompact & 2xHFA2kAVCEDSR_M
18.06.2023 - 2xHFA2kAVCOmniSR
14.06.2023 - 4xHFA2kLUDVAEGRL_small
10.06.2023 - 4xHFA2kLUDVAESwinIR_light & 4xHFA2kLUDVAESRFormer_light
01.06.2023 - 2xLexicaRRDBNet & 2xLexicaRRDBNet_Sharp
10.05.2023 - 4xNomos8kSC
07.05.2023 - 4xHFA2k
05.05.2023 - 2xParimgCompact
18.04.2023 - 2xHFA2kCompact
11.04.2023 - 4xLSDIRCompactv3 (Series 3)
25.03.2023 - 4xLSDIRCompact2
17.03.2023 - 4xLSDIRCompactC & 4xLSDIRCompactR
11.03.2023 - 4xLSDIRCompact
