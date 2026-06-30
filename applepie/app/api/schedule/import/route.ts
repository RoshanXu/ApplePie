import { NextResponse } from "next/server";

/**
 * POST /api/schedule/import
 * AI 课表导入（OCR 图片识别 + 语音解析）
 *
 * ================================================================
 * 技术方案（基于 research/课程表识别与语音识别开源方案调研.md）
 * ================================================================
 *
 * ## 图片/PDF 课表识别链路
 *
 *   拍照课表 → PaddleOCR + PP-Structure → 表格结构 JSON
 *   PDF 课表 → Camelot → DataFrame
 *     ↓
 *   DeepSeek v4-pro → 结构化纠错 + 语义理解 → 课程表 JSON
 *     ↓
 *   保存到 schedules 表
 *
 *   关键依赖（均为 Apache 2.0/MIT，免费商用）：
 *   - PaddleOCR (pip install paddlepaddle paddleocr) — 中文 OCR 最强
 *   - PP-Structure — 表格结构识别，支持合并单元格
 *   - Camelot (pip install camelot-py) — PDF 表格直接提取
 *   - DeepSeek v4-pro API — "最后一公里"结构化纠错
 *
 * ## 语音识别链路
 *
 *   语音输入 → SenseVoice-Small + sherpa-onnx → 文字
 *     ↓
 *   DeepSeek v4-pro → 时间表达式归一化 + 结构化 → 日程 JSON
 *     ↓
 *   保存到 schedules 表
 *
 *   关键依赖：
 *   - 移动端: SenseVoice-Small (234M) + sherpa-onnx → iOS/Android 离线推理
 *   - 服务端: FireRedASR v2 / Qwen3-ASR → 更高精度
 *   - FunASR 工具链: VAD + 标点恢复 + 说话人分离
 *
 * ## 替代方案
 *   - 开发速度优先: Nanonets-OCR-s (Qwen2.5-VL-3B) 端到端
 *   - 最高精度: YOLOv8 + PaddleOCR + LLM 纠错
 *
 * ================================================================
 * 当前状态: 预留接口，尚未集成开源 OCR/ASR 模型
 * 文字模型: DeepSeek v4-pro (TEXT_API_KEY 已配置)
 * ================================================================
 */
export async function POST(req: Request) {
  return NextResponse.json(
    {
      error: "AI schedule import is not yet implemented",
      message: "课表导入功能正在开发中。当前支持手动录入。",
      plan: {
        ocr: "PaddleOCR + PP-Structure (Apache 2.0)",
        pdf: "Camelot (MIT)",
        asr: "SenseVoice-Small + sherpa-onnx (Apache 2.0)",
        llm: "DeepSeek v4-pro — 结构化纠错",
      },
    },
    { status: 501 }
  );
}
