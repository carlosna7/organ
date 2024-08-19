import { AuthProvider } from "@/components/tokenContext"

export default function DashboardLayout({
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