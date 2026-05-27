import { Inter } from "next/font/google";
import "./globals.css";
import GoogleProvider from "../components/providers/GoogleProvider";
import QueryProvider from "../components/providers/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "LexAgile AI — Legal Enterprise Suite",
  description:
    "AI-powered legal operations platform. Manage cases, contracts, clients, billing and analytics with precision and intelligence.",
  keywords: ["legal tech", "AI", "contract analysis", "case management", "billing"],
  authors: [{ name: "LexAgile AI" }],
  openGraph: {
    title: "LexAgile AI — Legal Enterprise Suite",
    description: "AI-powered legal operations platform for modern law firms.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full font-sans antialiased">
        <QueryProvider>
          <GoogleProvider>
            {children}
          </GoogleProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
