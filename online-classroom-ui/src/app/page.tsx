import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import dynamic from "next/dynamic";
import {
  BookOpen,
  Video,
  FileCheck,
  BarChart3,
  MessageSquare,
  Calendar,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  Users,
  ShieldCheck,
  Star,
  GraduationCap,
  School,
  LayoutDashboard,
  LineChart,
} from "lucide-react";
import { PricingSection } from "@/components/pricing/PricingSection";
import FloatingContactWidget from "@/components/FloatingContactWidget";


// Lazy-load YouTube component
const LazyYouTube = dynamic(() => import("@/components/LazyYoutube"), {
  ssr: false,
  loading: () => (
    <div className="aspect-video w-full bg-muted animate-pulse rounded-3xl" />
  ),
});

export const metadata: Metadata = {
  title: "DoCus - Nền tảng quản lý lớp học toàn diện",
  description:
    "DoCus giúp đơn giản hóa việc dạy và học trực tuyến. Quản lý lớp học, bài tập và giao tiếp ở cùng một nơi.",
};

export default function Home() {
  const features = [
    {
      icon: Video,
      title: "Lớp học trực tuyến tương tác",
      description:
        "Tổ chức các buổi học chất lượng cao, tích hợp bảng trắng thời gian thực và chia sẻ bài giảng mượt mà.",
    },
    {
      icon: FileCheck,
      title: "Quản lý bài tập & chấm điểm tự động",
      description:
        "Giao bài tập trắc nghiệm tách câu, tự luận, tự động chấm điểm và thống kê kết quả tức thì.",
    },
    {
      icon: BookOpen,
      title: "Kho tài liệu & bài giảng tập trung",
      description:
        "Lưu trữ, phân loại và chia sẻ tài liệu học tập, slide bài giảng, video ghi hình cho toàn bộ lớp học.",
    },
    {
      icon: BarChart3,
      title: "Báo cáo & Phân tích chuyên sâu",
      description:
        "Theo dõi mức độ tham gia, bảng điểm tổng kết và tiến độ học tập của từng học sinh qua biểu đồ trực quan.",
    },
    {
      icon: MessageSquare,
      title: "Kênh thảo luận & Chat nhóm",
      description:
        "Tương tác hỏi đáp liên tục với nhóm chat lớp học, ghim tin nhắn quan trọng và trợ lý AI thông minh.",
    },
    {
      icon: Calendar,
      title: "Lịch học & Sự kiện thông minh",
      description:
        "Tự động đồng bộ lịch học, hạn chót nộp bài tập và nhắc nhở các kỳ thi quan trọng theo tuần/tháng.",
    },
  ];

  return (
    <div className="bg-background text-foreground font-sans min-h-screen selection:bg-primary selection:text-white">
      {/* ── HEADER / NAVBAR ── */}
      <header className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border/70 z-50 h-[70px]">
        <nav className="flex items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto h-full">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-xl font-heading font-bold text-foreground tracking-tight">
              DoCus
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-7 text-sm font-semibold text-secondary">
            <Link href="#features" className="hover:text-primary transition-colors">
              Tính năng
            </Link>
            <Link href="#demo-video" className="hover:text-primary transition-colors">
              Demo Video
            </Link>
            <Link href="#showcase" className="hover:text-primary transition-colors">
              Giao diện
            </Link>
            <Link href="#solutions" className="hover:text-primary transition-colors">
              Giải pháp
            </Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">
              Bảng giá
            </Link>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/sign-in"
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-foreground hover:text-primary transition-colors rounded-full hover:bg-card"
            >
              Đăng nhập
            </Link>
            <Link
              href="/sign-up"
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-full text-xs sm:text-sm transition-all shadow-sm active:scale-95"
            >
              Đăng ký miễn phí
            </Link>
          </div>
        </nav>
      </header>

      <main className="space-y-20 sm:space-y-28 pb-16">
        {/* ── HERO SECTION ── */}
        <section className="pt-12 sm:pt-20 px-4 sm:px-6 relative overflow-hidden">
          <div className="max-w-5xl mx-auto text-center space-y-7 relative z-10">
            {/* Pill Capsule Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/70 border border-primary/20 text-primary rounded-full font-semibold text-xs shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nền tảng giáo dục trực tuyến toàn diện & hiện đại</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-heading font-bold text-foreground tracking-tight leading-[1.18] max-w-4xl mx-auto">
              Dạy và học hiệu quả hơn, liền mạch hơn cùng <span className="text-primary">DoCus</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-secondary max-w-2xl mx-auto leading-relaxed">
              Giải pháp tất cả trong một giúp quản lý lớp học, bài tập trắc nghiệm & tự luận, chấm điểm tự động và gắn kết học sinh mọi lúc mọi nơi.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link
                href="/sign-up"
                className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-full shadow-md hover:shadow-lg transition-all text-sm sm:text-base flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Bắt đầu miễn phí ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#demo-video"
                className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-muted border border-border text-foreground font-bold rounded-full shadow-2xs transition-all text-sm sm:text-base flex items-center justify-center gap-2 active:scale-95"
              >
                <Play className="w-4 h-4 text-primary fill-primary" />
                <span>Xem Demo video</span>
              </Link>
            </div>

            {/* Metrics stats */}
            <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { number: "10,000+", label: "Học sinh tham gia" },
                { number: "500+", label: "Lớp học trực tuyến" },
                { number: "99.8%", label: "Tỷ lệ hài lòng" },
                { number: "24/7", label: "Hỗ trợ học tập" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-border shadow-2xs text-center"
                >
                  <p className="text-xl sm:text-2xl font-bold font-heading text-primary">
                    {stat.number}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── KEY FEATURES SECTION ── */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12 sm:mb-16">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-accent/60 border border-primary/20 text-primary rounded-full font-bold text-xs">
              Tính năng nổi bật
            </span>
            <h2 className="text-2xl sm:text-4xl font-heading font-bold text-foreground tracking-tight">
              Mọi công cụ đắc lực cho lớp học số
            </h2>
            <p className="text-sm sm:text-base text-secondary leading-relaxed">
              Thiết kế tinh gọn, trực quan và tối ưu hóa để phục vụ tối đa cho công tác giảng dạy và học tập.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-sm hover:shadow-md hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent text-primary flex items-center justify-center transition-transform group-hover:scale-110 shadow-2xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-heading font-bold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── DEMO VIDEO / VIRTUAL CLASSROOM (ĐẶT Ở TRÊN ẢNH) ── */}
        <section id="demo-video" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-border shadow-sm p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Video container */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-md border border-border bg-muted">
              <LazyYouTube videoId="dDuw0wr3thI" />
            </div>

            {/* Description */}
            <div className="space-y-5 text-left">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-accent/60 border border-primary/20 text-primary rounded-full font-bold text-xs">
                Trải nghiệm thực tế
              </div>
              <h3 className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight">
                Không gian lớp học ảo sinh động & trực quan
              </h3>
              <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                Tổ chức các bài giảng trực tuyến lôi cuốn, kết hợp bảng trắng cộng tác và chia sẻ tài liệu bài tập tức thì mà không cần cài đặt phần mềm phức tạp.
              </p>

              <div className="space-y-2.5 pt-2">
                {[
                  "Tích hợp phòng họp và bảng trắng tương tác thời gian thực",
                  "Chấm bài tập trắc nghiệm và nộp bài tự luận mượt mà",
                  "Giao diện chuẩn hóa trải nghiệm trên cả điện thoại và máy tính",
                ].map((text) => (
                  <div key={text} className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-full text-xs sm:text-sm shadow-sm transition-all active:scale-95"
                >
                  <span>Khám phá lớp học ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── VISUAL SHOWCASE SECTION (ẢNH NẰM DƯỚI VIDEO) ── */}
        <section id="showcase" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-accent/60 border border-primary/20 text-primary rounded-full font-bold text-xs">
              Khám phá giao diện
            </span>
            <h2 className="text-2xl sm:text-4xl font-heading font-bold text-foreground tracking-tight">
              Trải nghiệm lớp học số mượt mà
            </h2>
          </div>

          {/* Showcase Item 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-5 text-left order-2 lg:order-1">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-accent/60 border border-primary/20 text-primary rounded-full font-bold text-xs">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Bảng điều khiển trung tâm</span>
              </span>
              <h3 className="text-2xl sm:text-4xl font-heading font-bold text-foreground tracking-tight">
                Tất cả không gian lớp học trong tầm tay bạn
              </h3>
              <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                Quản lý nhiều lớp học, theo dõi bài tập sắp đến hạn, xem thông báo quan trọng và cập nhật tin tức lớp học ngay từ màn hình chính. Tiết kiệm thời gian và không bao giờ bỏ lỡ thông tin.
              </p>
              <div className="space-y-2 pt-2">
                {[
                  "Giao diện trực quan, nắm bắt thông tin lớp học chỉ trong 1 giây",
                  "Truy cập bài tập, điểm số và thành viên chỉ với 1 cú nhấp chuột",
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-card p-2 hover:shadow-2xl transition-all duration-300">
                <div className="relative rounded-2xl overflow-hidden aspect-[16/10] w-full border border-border">
                  <Image
                    src="/nen1.png"
                    alt="Bảng điều khiển trung tâm DoCus"
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Showcase Item 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <div className="relative rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-card p-2 hover:shadow-2xl transition-all duration-300">
                <div className="relative rounded-2xl overflow-hidden aspect-[16/10] w-full border border-border">
                  <Image
                    src="/nen2.png"
                    alt="Phân tích học tập trực quan DoCus"
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-5 text-left">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-accent/60 border border-primary/20 text-primary rounded-full font-bold text-xs">
                <LineChart className="w-3.5 h-3.5" />
                <span>Phân tích học tập trực quan</span>
              </span>
              <h3 className="text-2xl sm:text-4xl font-heading font-bold text-foreground tracking-tight">
                Hiểu sâu sắc hơn về tiến độ của học sinh
              </h3>
              <p className="text-xs sm:text-sm text-secondary leading-relaxed">
                Hệ thống báo cáo tự động hóa, biểu đồ phân tích và thống kê điểm thi giúp giáo viên dễ dàng nhận diện điểm mạnh, điểm yếu và cơ hội để phát triển cho từng học sinh.
              </p>
              <div className="space-y-2 pt-2">
                {[
                  "Bảng điểm tự động cập nhật ngay khi học sinh hoàn thành bài làm",
                  "Xuất dữ liệu Excel và PDF tiện lợi cho báo cáo học kỳ",
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SOLUTIONS SECTION (PERSONAS) ── */}
        <section id="solutions" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12 sm:mb-16">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-accent/60 border border-primary/20 text-primary rounded-full font-bold text-xs">
              Giải pháp tối ưu
            </span>
            <h2 className="text-2xl sm:text-4xl font-heading font-bold text-foreground tracking-tight">
              DoCus đồng hành cùng ai?
            </h2>
            <p className="text-sm sm:text-base text-secondary leading-relaxed">
              Giải pháp linh hoạt được may đo tỉ mỉ cho từng đối tượng trong hệ sinh thái giáo dục.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: GraduationCap,
                title: "Giáo viên",
                desc: "Tạo lớp học, soạn đề thi, chấm bài tập tự động và theo dõi bảng điểm học sinh dễ dàng.",
              },
              {
                icon: School,
                title: "Quản trị viên & Trường học",
                desc: "Quản lý tập trung toàn bộ khối lớp, tài khoản giáo viên, thống kê dữ liệu học tập minh bạch.",
              },
              {
                icon: Users,
                title: "Học sinh & Phụ huynh",
                desc: "Nộp bài trực tuyến, xem phản hồi chi tiết từ giáo viên và tra cứu tiến độ học tập bất cứ lúc nào.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-3xl p-7 border border-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between text-left space-y-5"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent text-primary flex items-center justify-center shadow-2xs">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-heading font-bold text-foreground">{title}</h3>
                  <p className="text-xs sm:text-sm text-secondary leading-relaxed">{desc}</p>
                </div>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover transition-colors"
                >
                  <span>Tìm hiểu thêm</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── TESTIMONIALS SECTION ── */}
        <section id="testimonials" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12 sm:mb-16">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-accent/60 border border-primary/20 text-primary rounded-full font-bold text-xs">
              Đánh giá từ người dùng
            </span>
            <h2 className="text-2xl sm:text-4xl font-heading font-bold text-foreground tracking-tight">
              Giáo viên và học sinh nói gì về DoCus?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "DoCus giúp tôi tiết kiệm 50% thời gian chấm bài và giao bài tập. Giao diện trực quan, ấm áp và rất dễ sử dụng cho học sinh.",
                name: "Cô Nguyễn Mai Anh",
                role: "Giáo viên THPT Chuyên Lam Sơn",
              },
              {
                quote:
                  "Học sinh của tôi rất hào hứng với bảng điểm và hệ thống làm bài trực tuyến. Mọi thông báo lớp học đều được nhận tức thì.",
                name: "Thầy Trần Hoàng Nam",
                role: "Tổ trưởng chuyên môn Toán",
              },
              {
                quote:
                  "Nền tảng chạy rất mượt mà trên cả điện thoại, việc nộp bài và xem lại đáp án chi tiết vô cùng tiện lợi.",
                name: "Em Lê Minh Trí",
                role: "Học sinh Lớp 12",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-3xl p-7 border border-border shadow-sm flex flex-col justify-between text-left space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-secondary italic leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="pt-3 border-t border-border/60">
                  <p className="font-heading font-bold text-sm text-foreground">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRICING SECTION ── */}
        <PricingSection />


        {/* ── CTA BANNER ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary text-primary-foreground rounded-3xl p-8 sm:p-14 text-center space-y-6 relative overflow-hidden shadow-xl">
            {/* Background glowing blobs */}
            <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <h2 className="text-2xl sm:text-4xl font-heading font-bold text-white tracking-tight">
                Sẵn sàng nâng tầm không gian lớp học số?
              </h2>
              <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                Tham gia cùng hàng nghìn giáo viên và học sinh đang trải nghiệm học tập hiệu quả mỗi ngày cùng DoCus.
              </p>
              <div className="pt-2">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-primary hover:bg-white/90 font-bold rounded-full shadow-md transition-all active:scale-95 text-xs sm:text-sm"
                >
                  <span>Tạo tài khoản miễn phí ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-card border-t border-border py-12 px-4 sm:px-8 text-foreground">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-3 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <span className="text-lg font-heading font-bold text-foreground">DoCus</span>
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              Nền tảng quản trị và tổ chức lớp học trực tuyến toàn diện cho thế hệ giáo dục mới.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Sản phẩm
            </p>
            <ul className="space-y-2 text-xs font-semibold text-secondary">
              <li><Link href="#features" className="hover:text-primary transition-colors">Tính năng</Link></li>
              <li><Link href="#pricing" className="hover:text-primary transition-colors">Bảng giá</Link></li>
              <li><Link href="#solutions" className="hover:text-primary transition-colors">Giải pháp</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Hỗ trợ
            </p>
            <ul className="space-y-2 text-xs font-semibold text-secondary">
              <li><Link href="#" className="hover:text-primary transition-colors">Trung tâm trợ giúp</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Hướng dẫn sử dụng</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Liên hệ hỗ trợ</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Pháp lý
            </p>
            <ul className="space-y-2 text-xs font-semibold text-secondary">
              <li><Link href="#" className="hover:text-primary transition-colors">Điều khoản dịch vụ</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Chính sách bảo mật</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-border/60 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} DoCus Education. Bảo lưu mọi quyền.
        </div>
      </footer>

      {/* ── FLOATING CONTACT WIDGET (CHAT, CALL, ZALO, MESSENGER) ── */}
      <FloatingContactWidget />
    </div>
  );
}