"use client";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";

function HomeContent() {
  const session = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  useEffect(() => {
    const error = searchParams.get('error')
    const connected = searchParams.get('connected')
    if (error) {
      toast.error(decodeURIComponent(error))
    }
    if (connected === 'true') {
      toast.success('Integration connected successfully')
    }
    if (session.status === 'unauthenticated') {
      router.push('/login')

    } else if (session.status === 'authenticated') {
      router.push('/dashboard/integrations')
    }
  }, [session, searchParams])
  return null
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  )
}
