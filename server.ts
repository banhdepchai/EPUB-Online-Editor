import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));

  // AI Endpoint for EPUB editing assistance
  app.post("/api/ai/process", async (req, res) => {
    try {
      const { action, text, prompt, targetLanguage, context } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: "Chưa cấu hình GEMINI_API_KEY trong môi trường/bí mật.",
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      let systemInstruction = "";
      let userPrompt = "";

      switch (action) {
        case "fix_grammar":
          systemInstruction =
            "Bạn là một trợ lý biên tập sách chuyên nghiệp. Hãy sửa lỗi chính tả, ngữ pháp và cải thiện văn phong cho đoạn văn bản sau. Giữ nguyên cấu trúc thẻ HTML nếu có.";
          userPrompt = `Đoạn văn cần sửa:\n${text}`;
          break;

        case "translate":
          systemInstruction = `Bạn là một dịch giả chuyên nghiệp. Hãy dịch đoạn văn bản sau sang ${
            targetLanguage || "Tiếng Việt"
          }. Giữ nguyên định dạng HTML và phong cách văn học của tác phẩm.`;
          userPrompt = `Văn bản cần dịch:\n${text}`;
          break;

        case "summarize":
          systemInstruction =
            "Bạn là một nhà phê bình và tóm tắt sách. Hãy viết tóm tắt ngắn gọn, súc tích (khoảng 2-4 câu) cho chương sách sau.";
          userPrompt = `Nội dung chương:\n${text}`;
          break;

        case "format_html":
          systemInstruction =
            "Bạn là chuyên gia về EPUB XHTML. Hãy làm sạch, chuẩn hóa và tối ưu hóa đoạn code HTML sau cho sách EPUB (sử dụng các thẻ p, h1, h2, blockquote, em, strong thích hợp). Chỉ trả về mã HTML kết quả trong khối code html hoặc văn bản HTML sạch.";
          userPrompt = `Code HTML:\n${text}`;
          break;

        case "generate_toc":
          systemInstruction =
            "Dựa trên danh sách các tiêu đề hoặc nội dung các chương, hãy tạo danh sách tên chương phù hợp cho mục lục sách. Trả về định dạng danh sách JSON array các chuỗi tiêu đề.";
          userPrompt = `Nội dung tổng quan:\n${text}`;
          break;

        case "custom_prompt":
          systemInstruction =
            "Bạn là trợ lý sáng tác và biên tập sách EPUB chuyên nghiệp. Thực hiện đúng yêu cầu của người dùng trên đoạn văn bản/chương sách được cung cấp. Bảo toàn các thẻ HTML nếu văn bản chứa HTML.";
          userPrompt = `Yêu cầu: ${prompt}\n\nVăn bản:\n${text}`;
          break;

        default:
          return res.status(400).json({ error: "Thao tác không hợp lệ." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }],
          },
        ],
      });

      const resultText = response.text || "";
      res.json({ result: resultText });
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      res.status(500).json({
        error: err.message || "Có lỗi xảy ra khi xử lý với Gemini AI.",
      });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for dev or static serving for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
