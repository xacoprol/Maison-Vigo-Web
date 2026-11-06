import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function VigoBodasLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      style={{
        minHeight: "100svh",
        height: "100%",
        overflow: "hidden",
        background: "#0f0d0c",
      }}
    >
      {children}
    </div>
  );
}
