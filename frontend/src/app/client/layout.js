import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import RoleGuard from "@/components/auth/RoleGuard";

export const metadata = {
  title: "Client Portal — LexAgile AI",
};

export default function ClientLayout({ children }) {
  return (
    <RoleGuard allowedRoles={["client", "admin"]}>
      <div className="flex h-full bg-background">
        <Sidebar />
        <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
          <TopBar />
          <div className="flex-1">{children}</div>
          <footer className="px-8 py-6 border-t border-outline-variant/20">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-on-surface-variant text-sm">
              <p>© 2024 LexAgile AI Enterprise. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-primary transition-colors">Security</a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </RoleGuard>
  );
}
