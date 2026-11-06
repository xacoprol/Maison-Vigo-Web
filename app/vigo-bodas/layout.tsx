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
  return children;
}
