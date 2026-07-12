import "./globals.css";
import { StorefrontProvider } from "@/lib/storefrontContext";

export const metadata = {
  title: "Dock9 Admin",
  description: "Pallet liquidation admin panel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StorefrontProvider>{children}</StorefrontProvider>
      </body>
    </html>
  );
}
