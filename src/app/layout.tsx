import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Organ | Organizador de equipe e tarefas",
    template: "%s | Organ",
  },
  description:
    "Crie a empresa, convide sua equipe por email e organize as tarefas com responsáveis e status: pendente, em andamento e concluída.",
  applicationName: "Organ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
