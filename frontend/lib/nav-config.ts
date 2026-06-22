export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const MAIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Buildings', href: '/buildings', icon: '🏢' },
  { label: 'Criteria', href: '/criteria', icon: '📋' },
  { label: 'Disability', href: '/disability', icon: '♿' },
  { label: 'Dimensions', href: '/dimensions', icon: '📐' },
  { label: 'Reports', href: '/reports', icon: '📈' },
];

export function isActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}
