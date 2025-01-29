import { AuthProvider } from "@/components/tokenContext"

export default function  PagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AuthProvider>
        {children}
      </AuthProvider>
    </>
  )
}