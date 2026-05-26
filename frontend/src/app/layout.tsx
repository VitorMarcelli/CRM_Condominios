import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug');
  
  if (!slug) {
    return {
      title: "Condominium CRM",
      description: "A plataforma inteligente para a gestão do seu condomínio",
    };
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/onboarding/organization/${slug}`, {
      next: { revalidate: 3600 } // cache for 1 hour
    });
    if (res.ok) {
      const data = await res.json();
      return {
        title: `${data.name} | Portal do Condomínio`,
        description: `Área restrita de ${data.name}`,
      };
    }
  } catch (error) {}

  return {
    title: "Condominium CRM",
    description: "A plataforma inteligente para a gestão do seu condomínio",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug');
  let primaryColor = undefined;
  
  if (slug) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/onboarding/organization/${slug}`, {
        next: { revalidate: 3600 }
      });
      if (res.ok) {
        const data = await res.json();
        primaryColor = data.branding?.primaryColor;
      }
    } catch (error) {}
  }

  // We can pass CSS variables down to the app via style
  const style = primaryColor ? { '--primary': primaryColor } as React.CSSProperties : undefined;

  return (
    <html lang="pt-BR">
      <body className={inter.className} style={style}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
