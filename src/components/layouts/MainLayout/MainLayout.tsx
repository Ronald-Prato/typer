import Image from "next/image";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950 text-white relative">
      {/* Fixed centered isometric image - behind everything */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="relative opacity-10">
          <Image
            src="/assets/img/dev11isometric.png"
            alt="Dev 11 Isometric"
            width={800}
            height={600}
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Page content - above the background image */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
