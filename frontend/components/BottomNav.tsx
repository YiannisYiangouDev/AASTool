"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: "📊", label: "Dashboard" },
    { href: "/building", icon: "🏢", label: "Building" },
    { href: "/disability", icon: "♿", label: "Disability" },
    { href: "/dimensions", icon: "📐", label: "Dims" },
    { href: "/criteria", icon: "📝", label: "Criteria" },
    { href: "/certification", icon: "🏆", label: "Cert" },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`bottom-nav-item ${pathname === item.href ? "active" : ""}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}