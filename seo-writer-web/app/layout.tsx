import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEO Article Writer",
  description: "Local staged SEO/GEO/AIO article writing workspace"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="app-shell">
          <header className="topbar">
            <a className="brand" href="/">
              <span className="brand-mark">S</span>
              <span>
                <strong>SEO Article Writer</strong>
                <small>Skill 调度工作台</small>
              </span>
            </a>
            <nav>
              <a href="/projects">项目</a>
              <a href="/projects/manage">管理</a>
              <a href="/projects/new">新建</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
