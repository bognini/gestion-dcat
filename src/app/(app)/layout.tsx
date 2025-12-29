import { AppLayoutProvider } from './layout-provider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppLayoutProvider>{children}</AppLayoutProvider>;
}
