import { LayoutGroup } from "motion/react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LayoutGroup>
        {children}
    </LayoutGroup>
  );
}
