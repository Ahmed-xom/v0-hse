import type { ReactNode } from "react";
export const metadata = { title: "AMNKO HSE | Independent MVP", description: "Independent multi-company HSE workspace" };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body style={{margin:0,fontFamily:"Arial, sans-serif",background:"#f4f6f8",color:"#17202a"}}>{children}</body></html>;
}
