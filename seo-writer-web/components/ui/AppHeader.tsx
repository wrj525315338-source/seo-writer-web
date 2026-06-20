"use client";

import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <span className="brand-mark">S</span>
        <span>
          <strong>SEO Article Writer</strong>
          <small>Skill 调度工作台</small>
        </span>
      </Link>
      <nav>
        <Link href="/projects">项目</Link>
        <Link href="/projects/manage">管理</Link>
        <Link href="/projects/new">新建</Link>
      </nav>
    </header>
  );
}
