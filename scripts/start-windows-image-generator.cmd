@echo off
setlocal

if "%SD_WEBUI_URL%"=="" set "SD_WEBUI_URL=http://127.0.0.1:7860"
if "%IMAGE_GENERATOR_HOST%"=="" set "IMAGE_GENERATOR_HOST=0.0.0.0"
if "%IMAGE_GENERATOR_PORT%"=="" set "IMAGE_GENERATOR_PORT=7861"
if "%IMAGE_GENERATION_SIZE%"=="" set "IMAGE_GENERATION_SIZE=384"
if "%SD_STEPS%"=="" set "SD_STEPS=14"
if "%SD_CFG_SCALE%"=="" set "SD_CFG_SCALE=6.5"
if "%SD_SAMPLER%"=="" set "SD_SAMPLER=Euler a"
if "%IMAGE_GENERATOR_TOKEN%"=="" set "IMAGE_GENERATOR_TOKEN=would-you-dao-local"

rem Optional: local Ollama powers prompt rewriting and /translate for EN/KR vote text (set values before running this script)
rem set USE_LOCAL_LLM_PROMPTS=1
rem set OLLAMA_URL=http://127.0.0.1:11434
rem set OLLAMA_MODEL=qwen2.5:3b-instruct

rem Optional: upload PNGs to Pinata and return public gateway URLs instead of data URLs (paste your own JWT; do not commit secrets)
rem set PINATA_JWT=PASTE_YOUR_PINATA_JWT_HERE
rem set PINATA_GATEWAY=https://YOUR_GATEWAY.mypinata.cloud

echo Would You DAO local image generator
echo Stable Diffusion WebUI: %SD_WEBUI_URL%
echo Bridge: http://%IMAGE_GENERATOR_HOST%:%IMAGE_GENERATOR_PORT%/generate
echo Size: %IMAGE_GENERATION_SIZE%x%IMAGE_GENERATION_SIZE%
echo Token: %IMAGE_GENERATOR_TOKEN%
echo.

node scripts\sd-webui-generator.js
