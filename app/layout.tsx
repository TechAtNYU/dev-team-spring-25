import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@shared/components/ui/sidebar";
import { ThemeProvider } from "@shared/components/ui/theme-provider";
import { AppSidebar } from "@shared/components/ui/sidebar/app-sidebar";
import UserContextProvider from "@shared/lib/userContext/userContext";
import { getUserAndClassroomData } from "@shared/lib/userContext/contextFetcher";
import { cn } from "@shared/lib/utils";
import { Separator } from "@shared/components/ui/separator";
import { Toaster } from "@/shared/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClassroomLM",
  description: "Generated by create next app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userData = await getUserAndClassroomData();
  // TODO: change this?

  return (
    <html lang="en">
      <body
        className={cn(
          `font-sans antialiased`,
          geistSans.variable,
          geistMono.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          // disableTransitionOnChange
        >
          {userData ? (
            <SidebarProvider>
              <UserContextProvider userAndClassDataInitial={userData}>
                <AppSidebar />
                <Toaster
                  // richColors
                  duration={40000}
                  expand
                  // richColors
                  closeButton
                  toastOptions={{
                    classNames: {
                      closeButton: "!absolute !left-[99%] !top-[2px]", //!bg-background !border-black !text-foreground",
                    },
                  }}
                />
                <SidebarInset className="md:peer-data-[variant=inset]:mr-7 md:peer-data-[variant=inset]:mt-10">
                  <main>
                    <header className="flex h-16 shrink-0 items-center gap-2">
                      <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                          orientation="vertical"
                          className="mr-2 h-4"
                        />
                      </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                      {children}
                    </div>
                  </main>
                </SidebarInset>
              </UserContextProvider>
            </SidebarProvider>
          ) : (
            <main>{children}</main>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
