import type { Metadata } from "next";
import "./globals.css";
import "../styles/components.css";
import AppHeader from "../components/ui/AppHeader";

export const metadata: Metadata = {
  title: "SEO Article Writer",
  description: "Local staged SEO/GEO/AIO article writing workspace"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="app-shell">
          <AppHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
