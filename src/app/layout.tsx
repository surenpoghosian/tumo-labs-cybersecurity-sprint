import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "",
//   authDomain: "cybersec-259b8.firebaseapp.com",
//   projectId: "cybersec-259b8",
//   storageBucket: "cybersec-259b8.firebasestorage.app",
//   messagingSenderId: "1002878831445",
//   appId: "1:1002878831445:web:61e5a9dd820a9821767ddc",
//   measurementId: "G-JJX18CNQHH"
// };

// const app = initializeApp(firebaseConfig);
// getAnalytics(app);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Armenian CyberSec Docs",
  description: "Translate CyberSec docs to Armenian",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
