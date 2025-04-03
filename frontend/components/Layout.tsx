import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Navbar from "./Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const { status } = useSession();

  // Don't show navbar on login page
  const showNavbar = !router.pathname.includes("/login");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>Medical Chatbot</title>
        <meta
          name="description"
          content="AI-powered medical chatbot for health guidance"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {showNavbar && <Navbar />}

      <main className="min-h-screen">{children}</main>
    </div>
  );
};

export default Layout;
