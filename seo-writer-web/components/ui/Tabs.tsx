"use client";

import type { ReactNode } from "react";

interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  children?: ReactNode;
}

export default function Tabs({ tabs, activeKey, onChange, children }: TabsProps) {
  return (
    <div>
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`tab${tab.key === activeKey ? " active" : ""}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
