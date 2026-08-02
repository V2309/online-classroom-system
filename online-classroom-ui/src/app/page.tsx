import Link from "next/link"
import Image from "next/image"
import { Metadata } from "next"
import dynamic from "next/dynamic"

// Lazy-load YouTube component
const LazyYouTube = dynamic(() => import('@/components/LazyYoutube'), {
  ssr: false,
  loading: () => <div className="aspect-video w-full bg-muted animate-pulse rounded-xl" />,
});

export const metadata: Metadata = {
  title: "DoCus - Nền tảng quản lý lớp học toàn diện",
  description: "DoCus giúp đơn giản hóa việc dạy và học trực tuyến. Quản lý lớp học, bài tập và giao tiếp ở cùng một nơi.",
}

/* ============================================================
   Sub-components
   ============================================================ */

const FeatureIcon = ({ emoji }: { emoji: string }) => (
  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl mb-6 text-2xl transition-all duration-300 group-hover:scale-105">
    {emoji}
  </div>
)

const HowItWorksStep = ({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) => (
  <div className="p-8 bg-card rounded-xl border border-border/80 shadow-sm transition-all duration-300 hover:shadow-md text-left">
    <div className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-lg font-bold text-lg mb-6">
      {number}
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-3 text-balance">{title}</h3>
    <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
  </div>
)

const TestimonialCard = ({
  quote,
  name,
  role,
}: {
  quote: string;
  name: string;
  role: string;
  avatar: string;
}) => (
  <div className="bg-card p-8 rounded-xl border border-border/80 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between h-full text-left">
    <div>
      <div className="text-primary/30 text-5xl font-serif leading-none mb-2">&ldquo;</div>
      <p className="text-muted-foreground mb-8 leading-relaxed text-sm italic">{quote}</p>
    </div>
    <div className="flex items-center mt-auto border-t border-muted/80 pt-6">
      <div className="w-10 h-10 rounded-full bg-muted mr-3 flex-shrink-0 flex items-center justify-center font-bold text-muted-foreground text-sm">
        {name.charAt(0)}
      </div>
      <div>
        <p className="font-semibold text-foreground text-sm">{name}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
    </div>
  </div>
)

const CheckIcon = () => (
  <div className="w-5 h-5 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
    <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  </div>
)

/* ============================================================
   MAIN PAGE
   ============================================================ */

export default function Home() {
  const features = [
    {
      icon: "💻",
      title: "Lớp học trực tuyến tương tác",
      description: "Tổ chức các buổi học video chất lượng cao, tích hợp bảng trắng và chia sẻ màn hình.",
    },
    {
      icon: "📝",
      title: "Quản lý bài tập & điểm số",
      description: "Giao bài tập, chấm điểm và theo dõi tiến độ của học sinh một cách dễ dàng.",
    },
    {
      icon: "📚",
      title: "Kho tài liệu tập trung",
      description: "Tải lên và chia sẻ tài liệu học tập, bài giảng và video cho cả lớp.",
    },
    {
      icon: "📊",
      title: "Báo cáo & Phân tích",
      description: "Theo dõi sự tham gia và kết quả học tập của học sinh qua các báo cáo trực quan.",
    },
    {
      icon: "💬",
      title: "Kênh giao tiếp hiệu quả",
      description: "Giao tiếp với học sinh và phụ huynh qua các thông báo và tin nhắn riêng tư.",
    },
    {
      icon: "🗓️",
      title: "Lịch học thông minh",
      description: "Tự động sắp xếp lịch học, nhắc nhở về các kỳ thi và sự kiện quan trọng.",
    },
  ]

  return (
    <div className="bg-background text-foreground font-sans min-h-screen">

      {/* ── HEADER ── */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/80 z-50 h-16">
        <nav className="flex items-center justify-between px-6 max-w-7xl mx-auto h-full">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path d="M2 17L12 22L22 17" />
                <path d="M2 12L12 17L22 12" />
              </svg>
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">DoCus</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {[
              { href: "#features", label: "Tính năng" },
              { href: "#solutions", label: "Giải pháp" },
              { href: "#pricing", label: "Bảng giá" },
              { href: "#", label: "Hỗ trợ" },
            ].map(({ href, label }) => (
              <Link key={href + label} href={href} className="text-muted-foreground hover:text-primary transition-colors font-medium text-sm">
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/sign-in"
              className="px-4 py-2 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors rounded-lg hover:bg-muted"
            >
              Đăng nhập
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg text-sm hover:bg-primary-dark transition-colors shadow-sm"
            >
              Đăng ký miễn phí
            </Link>
          </div>
        </nav>
      </header>

      <main>

        {/* ── HERO ── */}
        <section className="bg-background border-b border-muted/30 md:py-8 relative overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-6 text-center z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full font-medium text-xs mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse"></span>
              Nền tảng giáo dục cho lớp học trực tuyến
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight md:leading-[1.15] mb-8 max-w-4xl mx-auto">
              Dạy và học hiệu quả hơn cùng DoCus
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              Nền tảng tất cả trong một giúp bạn quản lý lớp học, giao bài tập, theo dõi tiến độ và kết nối với học sinh một cách liền mạch.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center px-6 py-3.5 bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-lg shadow-sm transition-colors text-base"
              >
                <span>Bắt đầu ngay</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="#demo-video"
                className="inline-flex items-center justify-center px-6 py-3.5 bg-background border border-border hover:bg-muted text-muted-foreground hover:text-foreground font-semibold rounded-lg transition-colors text-base"
              >
                <svg className="w-4 h-4 mr-2 text-muted-foreground/60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Xem Demo
              </Link>
            </div>

            {/* Trust logos */}
            <div className="text-center">
              <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-6">
                Được tin dùng bởi các tổ chức giáo dục hàng đầu
              </p>
              <div className="flex justify-center items-center gap-4 md:gap-8 flex-wrap">
                {["Trường ABC", "Đại học XYZ", "Trung tâm Edu", "Tổ chức DEF"].map((name) => (
                  <div key={name} className="px-5 py-2.5 bg-muted border border-border/60 rounded-lg">
                    <span className="text-sm font-semibold text-muted-foreground">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="py-20 md:py-8 bg-muted/30 border-b border-border/20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="inline-flex items-center px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full font-medium text-xs mb-4">
                Tính năng nổi bật
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
                Mọi công cụ bạn cần cho lớp học số
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                DoCus được thiết kế với các tính năng mạnh mẽ để hỗ trợ giáo viên và truyền cảm hứng cho học sinh.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="group bg-card p-8 rounded-xl border border-border/80 shadow-sm hover:shadow-md transition-all duration-300">
                  <FeatureIcon emoji={feature.icon} />
                  <h3 className="text-lg font-semibold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DEMO VIDEO ── */}
        <section id="demo-video" className="py-20 md:py-8 bg-background border-b border-border/20">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="aspect-video w-full rounded-xl shadow-md border border-border/80 overflow-hidden bg-muted">
              <LazyYouTube videoId="dDuw0wr3thI" />
            </div>

            <div className="space-y-6 text-left">
              <span className="inline-flex items-center px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full font-medium text-xs">
                Trải nghiệm tương tác
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Học tập hấp dẫn với video trực quan</h3>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                Mang lại các bài giảng sống động và thu hút sự chú ý của học sinh với khả năng tích hợp video mượt mà.
                Chia sẻ nội dung đa phương tiện, thực hiện các buổi hỏi đáp trực tiếp và làm cho việc học trở nên tương tác hơn bao giờ hết.
              </p>
              <Link
                href="#"
                className="inline-flex items-center px-5 py-2.5 bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-lg shadow-sm transition-colors text-sm"
              >
                <span>Khám phá lớp học ảo</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ── VISUAL SHOWCASE ── */}
        <section className="py-20 md:py-8 bg-muted/30 border-b border-border/20">
          <div className="max-w-7xl mx-auto px-6 space-y-20 md:space-y-24">

            {/* Feature 1 */}
            <div className="grid md:grid-cols-2 gap-12 items-center text-left">
              <div>
                <span className="inline-flex items-center px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full font-medium text-xs mb-4">
                  Bảng điều khiển trung tâm
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 tracking-tight">Tất cả trong một bảng điều khiển duy nhất</h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Quản lý nhiều lớp học, theo dõi bài tập sắp đến hạn và xem các thông báo quan trọng ngay từ màn hình chính.
                  Tiết kiệm thời gian và không bao giờ bỏ lỡ thông tin.
                </p>
              </div>
              <div className="relative rounded-xl border border-border shadow-sm overflow-hidden bg-card p-2">
                <Image
                  src="/nen1.png"
                  alt="Ảnh chụp màn hình ứng dụng"
                  className="rounded-lg object-cover h-full w-full border border-muted"
                  width={500}
                  height={300}
                  priority
                />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid md:grid-cols-2 gap-12 items-center text-left">
              <div className="relative rounded-xl border border-border shadow-sm overflow-hidden bg-card p-2 md:order-last">
                <Image
                  src="/nen2.png"
                  alt="Ảnh chụp màn hình ứng dụng"
                  className="rounded-lg object-cover h-full w-full border border-muted"
                  width={500}
                  height={300}
                  priority
                />
              </div>
              <div>
                <span className="inline-flex items-center px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full font-medium text-xs mb-4">
                  Phân tích học tập trực quan
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 tracking-tight">Hiểu sâu hơn về tiến độ của học sinh</h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  Sử dụng các biểu đồ và dữ liệu trực quan để dễ dàng xác định điểm mạnh, điểm yếu và các cơ hội để cải thiện cho từng học sinh.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ── SOLUTIONS ── */}
        <section id="solutions" className="py-20 md:py-8 bg-background border-b border-border/20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="inline-flex items-center px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full font-medium text-xs mb-4">
                Giải pháp toàn diện
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">DoCus dành cho ai?</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Cho dù bạn là giáo viên, quản trị viên hay phụ huynh, DoCus đều có giải pháp giúp trải nghiệm giáo dục tốt hơn.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { emoji: "🧑‍🏫", title: "Giáo viên", desc: "Tổ chức lớp học, quản lý bài tập và giao tiếp hiệu quả với học sinh." },
                { emoji: "🎓", title: "Quản trị viên", desc: "Giám sát hoạt động của trường, quản lý tài khoản và tích hợp hệ thống dễ dàng." },
                { emoji: "👨‍👩‍👧‍👦", title: "Phụ huynh & Học sinh", desc: "Theo dõi tiến độ học tập, truy cập tài liệu và tương tác với giáo viên." },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className="bg-muted/40 border border-border/80 p-8 rounded-xl hover:shadow-sm transition-all duration-300 text-center flex flex-col justify-between items-center h-full">
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-3xl mb-6">
                      {emoji}
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">{desc}</p>
                  </div>
                  <Link href="#" className="inline-flex items-center text-primary hover:text-primary-dark text-sm font-semibold transition-colors mt-auto">
                    <span>Tìm hiểu thêm</span>
                    <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-20 md:py-8 bg-muted/30 border-b border-border/20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="inline-flex items-center px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full font-medium text-xs mb-4">
                Quy trình đơn giản
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
                Bắt đầu chỉ với 3 bước đơn giản
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Gia nhập DoCus và thiết lập lớp học của bạn chưa bao giờ dễ dàng hơn.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <HowItWorksStep number={1} title="Tạo Lớp Học" description="Thiết lập lớp học ảo của bạn trong vài phút và gửi mã mời cho học sinh tham gia." />
              <HowItWorksStep number={2} title="Tổ Chức Bài Giảng" description="Tải lên tài liệu, giao bài tập và lên lịch các buổi học trực tuyến một cách khoa học." />
              <HowItWorksStep number={3} title="Theo Dõi & Tương Tác" description="Chấm điểm, gửi phản hồi và theo dõi sự tiến bộ của học sinh theo thời gian thực." />
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="py-20 md:py-8 bg-background border-b border-border/20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="inline-flex items-center px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full font-medium text-xs mb-4">
                Phản hồi từ người dùng
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
                Giáo viên và học sinh nói gì về DoCus?
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Chúng tôi tự hào khi được đồng hành và hỗ trợ công việc giảng dạy mỗi ngày.
              </p>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              <TestimonialCard
                quote="DoCus đã thay đổi hoàn toàn cách tôi quản lý lớp học. Mọi thứ đều tập trung ở một nơi, giúp tôi tiết kiệm rất nhiều thời gian và công sức."
                name="Cô Mai Anh"
                role="Giáo viên Văn, Trường THPT Chuyên Lam Sơn"
                avatar="/path/to/avatar1.jpg"
              />
              <TestimonialCard
                quote="Giao diện rất thân thiện và dễ sử dụng. Học sinh của tôi cũng rất thích thú với việc nộp bài và nhận phản hồi trực tiếp trên nền tảng."
                name="Thầy Hoàng Nam"
                role="Giáo viên Tin học, Trung tâm Olympia"
                avatar="/path/to/avatar2.jpg"
              />
              <TestimonialCard
                quote="Tính năng phân tích học tập thực sự hữu ích. Tôi có thể nắm bắt được tình hình học tập của cả lớp và của từng em một cách nhanh chóng."
                name="Cô Thuỳ Linh"
                role="Tổ trưởng chuyên môn, Trường Quốc tế Việt Úc"
                avatar="/path/to/avatar3.jpg"
              />
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" className="py-20 md:py-8 bg-muted/30 border-b border-border/20">
          <div className="max-w-4xl mx-auto text-center px-6">
            <div className="inline-flex items-center px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full font-medium text-xs mb-4">
              Gói dịch vụ
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Chọn gói phù hợp với bạn
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-16 leading-relaxed">
              DoCus cung cấp các gói linh hoạt để đáp ứng nhu cầu của mọi quy mô lớp học và tổ chức.
            </p>

            <div className="grid md:grid-cols-2 gap-8 text-left">
              {/* Free plan */}
              <div className="bg-card p-8 rounded-xl border border-border/80 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow duration-300">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">Miễn phí</h3>
                  <p className="text-muted-foreground text-sm mb-6">Tuyệt vời cho giáo viên cá nhân và lớp học nhỏ.</p>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-foreground">0đ</span>
                    <span className="text-sm text-muted-foreground ml-1">/ tháng</span>
                  </div>
                  <ul className="text-left space-y-3.5 mb-8">
                    <li className="flex items-center text-sm text-muted-foreground"><CheckIcon /><span>Quản lý 1 lớp học</span></li>
                    <li className="flex items-center text-sm text-muted-foreground"><CheckIcon /><span>Tích hợp video cơ bản</span></li>
                  </ul>
                </div>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center w-full px-5 py-2.5 bg-muted hover:bg-muted/80 border border-border text-foreground font-semibold rounded-lg text-sm transition-colors"
                >
                  Bắt đầu miễn phí
                </Link>
              </div>

              {/* Premium plan */}
              <div className="bg-card p-8 rounded-xl border-2 border-primary shadow-md relative flex flex-col justify-between h-full">
                <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Phổ biến nhất
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1 mt-2">Cao cấp</h3>
                  <p className="text-muted-foreground text-sm mb-6">Dành cho các tổ chức và giáo viên muốn sử dụng đầy đủ tính năng.</p>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-primary">Liên hệ</span>
                  </div>
                  <ul className="text-left space-y-3.5 mb-8">
                    <li className="flex items-center text-sm text-muted-foreground"><CheckIcon /><span>Mọi tính năng của gói Miễn phí</span></li>
                    <li className="flex items-center text-sm text-muted-foreground"><CheckIcon /><span>Phân tích nâng cao</span></li>
                    <li className="flex items-center text-sm text-muted-foreground"><CheckIcon /><span>Hỗ trợ ưu tiên</span></li>
                  </ul>
                </div>
                <Link
                  href="/contact-sales"
                  className="inline-flex items-center justify-center w-full px-5 py-2.5 bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-lg text-sm transition-colors shadow-sm"
                >
                  Liên hệ bán hàng
                </Link>
              </div>
            </div>
            <p className="text-muted-foreground text-xs mt-8 text-center">Bạn có thể hủy bỏ bất cứ lúc nào.</p>
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="py-8 bg-background">
          <div className="max-w-6xl mx-auto px-6">
            <div className="bg-slate-900 rounded-xl p-10 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-10 relative overflow-hidden border border-slate-800">
              <div className="relative z-10 text-center lg:text-left flex-1 min-w-0">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight leading-tight">
                  Sẵn sàng để chuyển đổi lớp học của bạn?
                </h2>
                <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
                  Tham gia cùng hàng ngàn giáo viên đang giảng dạy hiệu quả hơn với DoCus. Đăng ký tài khoản miễn phí ngay hôm nay.
                </p>
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row gap-4 flex-shrink-0">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary-dark text-primary-foreground font-semibold rounded-lg text-sm transition-colors shadow-sm"
                >
                  Đăng ký ngay
                </Link>
                <Link
                  href="#"
                  className="inline-flex items-center justify-center px-6 py-3 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-semibold rounded-lg text-sm transition-colors"
                >
                  Tư vấn lộ trình
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="py-8 bg-muted border-t border-border/80">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
          {[
            {
              title: "Sản phẩm",
              links: [
                { href: "#features", label: "Tính năng" },
                { href: "#pricing", label: "Bảng giá" },
                { href: "#solutions", label: "Giải pháp" },
                { href: "#", label: "Bảo mật" },
              ],
            },
            {
              title: "Tài nguyên",
              links: [
                { href: "#", label: "Blog" },
                { href: "#", label: "Trung tâm hỗ trợ" },
                { href: "#", label: "Webinars" },
                { href: "#", label: "Hướng dẫn" },
              ],
            },
            {
              title: "Công ty",
              links: [
                { href: "#", label: "Về chúng tôi" },
                { href: "#", label: "Tuyển dụng" },
                { href: "#", label: "Điều khoản" },
                { href: "#", label: "Chính sách" },
              ],
            },
            {
              title: "Kết nối",
              links: [
                { href: "#", label: "Facebook" },
                { href: "#", label: "LinkedIn" },
                { href: "#", label: "YouTube" },
                { href: "#", label: "Liên hệ" },
              ],
            },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-xs font-semibold text-foreground tracking-wider uppercase mb-6">{title}</h4>
              <ul className="space-y-3">
                {links.map(({ href, label }) => (
                  <li key={label}>
                    <Link href={href} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border/50 pt-8">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-xs text-muted-foreground/60">© {new Date().getFullYear()} DoCus. Đã đăng ký bản quyền.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}