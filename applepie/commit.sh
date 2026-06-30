#!/bin/bash
cd /d/Project/ApplePie
git add -A
git commit -m "feat: game progress bar + session save + ASR/OCR + all AI models configured

## Game improvements
- Progress bar with stage messages during loading/generating
- SSE stream progress tracking (plan → beats → background → done)
- localStorage game session save/restore (continue from last node)
- GameEntry shows 'Continue' card when saved session exists

## AI model configuration
- Vision: switched to Doubao Seed 2.0 (doubao-seed-2-0-mini-260428)
- Image: switched to Doubao Seedream 5.0 (doubao-seedream-5-0-260128)
- TTS: Xiaomi MiMo v2.5 (mimo-v2.5) configured
- MOCK_IMAGE=false — real image generation enabled

## Schedule import API
- OCR path: image → Doubao Vision → DeepSeek structuring → schedule JSON
- ASR path: audio → Xiaomi MiMo ASR → DeepSeek structuring → schedule JSON
- New lib/ai-client/asr.ts — MiMo speech-to-text client

## All models status
- DeepSeek v4-pro: text generation ✅
- Doubao Seed 2.0: multimodal vision/OCR ✅
- Doubao Seedream 5.0: game scene images ✅
- Xiaomi MiMo v2.5: TTS voice + ASR speech recognition ✅"
git push origin master
echo "Done!"
