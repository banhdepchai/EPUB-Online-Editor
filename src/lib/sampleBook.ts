import { EpubBook, EpubChapter, EpubMetadata, EpubAsset } from "../types";

export function createSampleBook(): EpubBook {
  const metadata: EpubMetadata = {
    title: "Hoàng Tử Bé (Le Petit Prince)",
    creator: "Antoine de Saint-Exupéry",
    publisher: "NXB Văn Học",
    language: "vi",
    identifier: "urn:uuid:978-604-56-1234-5",
    description: "Tác phẩm kinh điển về tình bạn, tình yêu và những bài học cuộc sống sâu sắc qua góc nhìn của Hoàng Tử Bé.",
    rights: "Công cộng / Public Domain",
    coverImageHref: "Images/cover.jpg",
    coverImageDataUrl:
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'><rect width='400' height='600' fill='%231e293b'/><circle cx='200' cy='220' r='100' fill='%23fbbf24'/><circle cx='200' cy='220' r='90' fill='%231e293b'/><path d='M200 130 A90 90 0 0 1 200 310 A70 70 0 0 0 200 130' fill='%23fef08a'/><text x='200' y='420' font-family='sans-serif' font-size='28' font-weight='bold' fill='%23f8fafc' text-anchor='middle'>HOÀNG TỬ BÉ</text><text x='200' y='460' font-family='sans-serif' font-size='18' fill='%2394a3b8' text-anchor='middle'>Antoine de Saint-Exupéry</text><text x='200' y='520' font-family='sans-serif' font-size='14' fill='%23fbbf24' text-anchor='middle'>★ Sách Mẫu Chỉnh Sửa EPUB ★</text></svg>",
  };

  const chapters: EpubChapter[] = [
    {
      id: "chapter_1",
      href: "Text/chapter1.xhtml",
      fullPath: "OEBPS/Text/chapter1.xhtml",
      title: "Lời Nói Đầu & Bức Tranh Trăn Nuốt Voi",
      playOrder: 1,
      mediaType: "application/xhtml+xml",
      content: `<h1>Lời Nói Đầu & Bức Tranh Trăn Nuốt Voi</h1>
<p class="lead">Xin lỗi các bạn nhỏ vì tôi đã đề tặng cuốn sách này cho một người lớn.</p>
<p>Tôi có một lý do nghiêm túc để làm điều đó: người lớn này là người bạn tốt nhất mà tôi có trên đời. Tôi lại có một lý do khác nữa: người lớn này có thể hiểu được mọi thứ, kể cả những cuốn sách cho trẻ con.</p>
<hr/>
<p>Năm lên sáu tuổi, có một lần tôi nhìn thấy một bức tranh tuyệt đẹp trong một cuốn sách viết về Rừng Nguyên Sinh mang tên <em>"Những câu chuyện có thật"</em>. Bức tranh vẽ một con trăn gấm đang nuốt chửng một con thú dữ.</p>
<blockquote><p>"Trăn nuốt chửng con mồi mà không cần nhai. Sau đó chúng không thể di chuyển được nữa và nằm ngủ suốt sáu tháng để tiêu hóa."</p></blockquote>
<p>Tôi đã suy nghĩ rất nhiều về những cuộc phiêu lưu trong rừng rậm và đến lượt mình, tôi đã thành công vẽ được bức tranh đầu tiên bằng bút chì màu: <strong>Bức Tranh Số 1</strong> của tôi.</p>`,
    },
    {
      id: "chapter_2",
      href: "Text/chapter2.xhtml",
      fullPath: "OEBPS/Text/chapter2.xhtml",
      title: "Chương I: Cuộc Gặp Sống Còn Trên Sa Mạc",
      playOrder: 2,
      mediaType: "application/xhtml+xml",
      content: `<h1>Chương I: Cuộc Gặp Sống Còn Trên Sa Mạc</h1>
<p>Tôi đã sống cô đơn như thế, không có ai để thực sự trò chuyện, cho tới khi gặp sự cố trên sa mạc Sahara sáu năm về trước. Có cái gì đó đã bị gãy trong động cơ máy bay của tôi.</p>
<p>Vì không mang theo thợ máy hay hành khách nào, tôi phải tự mình thực hiện một cuộc sửa chữa khó khăn. Đó là vấn đề sống còn đối với tôi. Tôi chỉ còn đủ nước uống cho tám ngày.</p>
<p>Đêm đầu tiên, tôi ngủ gục trên cát, cách xa mọi vùng đất có người sinh sống hàng ngàn dặm. Tôi còn cô đơn hơn một người sống sót sau tai nạn chìm tàu trên chiếc bè giữa đại dương.</p>
<h2>Giọng Nói Kỳ Lạ</h2>
<p>Thế nên bạn có thể hình dung được sự kinh ngạc của tôi khi bình minh tới, có một giọng nói nhỏ bé kỳ lạ đã đánh thức tôi dậy:</p>
<blockquote class="dialogue"><p>– Xin vui lòng... vẽ cho tôi một con cừu!</p><p>– Cái gì?</p><p>– Vẽ cho tôi một con cừu...</p></blockquote>
<p>Tôi nhảy bật dậy như bị sét đánh. Tôi dụi mắt. Tôi nhìn thật kỹ. Và tôi nhìn thấy một cậu bé phi thường đang đăm đăm quan sát tôi...</p>`,
    },
    {
      id: "chapter_3",
      href: "Text/chapter3.xhtml",
      fullPath: "OEBPS/Text/chapter3.xhtml",
      title: "Chương II: Bông Hoa Hồng Và Bí Mật Của Cáo",
      playOrder: 3,
      mediaType: "application/xhtml+xml",
      content: `<h1>Chương II: Bông Hoa Hồng Và Bí Mật Của Cáo</h1>
<p>Chẳng mấy chốc tôi đã hiểu rõ hơn về bông hoa trên hành tinh B612 của Hoàng Tử Bé. Đó là một bông hoa kiêu kỳ và nhạy cảm.</p>
<p>Bông hoa đã làm cậu khổ tâm vì sự tự do kiêu hãnh của nó. Nhưng khi phải chia tay hành tinh của mình, Hoàng Tử Bé mới nhận ra cậu đã thương yêu bông hoa đến nhường nào.</p>
<h2>Bí Mật Của Con Cáo</h2>
<p>Khi đến Trái Đất, cậu gặp một con cáo vàng dưới cây táo.</p>
<p>– <em>"Cảm hóa"</em> nghĩa là gì? – Hoàng Tử Bé hỏi.</p>
<p>– Đó là một điều đã bị bỏ quên từ lâu, – Con Cáo nói. – Nó có nghĩa là <strong>"tạo nên những mối liên hệ"</strong>...</p>
<blockquote><p>"Người ta chỉ nhìn thấy rõ ràng bằng trái tim. Những gì cốt lõi thì mắt thường không thể thấy được."</p></blockquote>
<p>Hoàng Tử Bé nhắc lại để cho nhớ: <em>"Những gì cốt lõi thì mắt thường không thể thấy được."</em></p>`,
    },
  ];

  const assets: EpubAsset[] = [
    {
      id: "style_css",
      href: "Styles/style.css",
      fullPath: "OEBPS/Styles/style.css",
      mediaType: "text/css",
      text: `body { font-family: serif; line-height: 1.7; margin: 1.2em; color: #1e293b; } h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.3em; } p { text-indent: 1.5em; text-align: justify; } blockquote { font-style: italic; background: #f8fafc; padding: 0.8em 1.2em; border-left: 4px solid #3b82f6; margin: 1em 0; }`,
    },
  ];

  return {
    rawZipAny: null,
    opfPath: "OEBPS/content.opf",
    baseDir: "OEBPS",
    metadata,
    chapters,
    assets,
    tocNcxPath: "OEBPS/toc.ncx",
    navXhtmlPath: "OEBPS/nav.xhtml",
    filename: "Hoang_Tu_Be_Sample.epub",
  };
}
