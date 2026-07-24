"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
export default function Home() {
  const session=useSession()
  const router=useRouter()
  useEffect(()=>{
    if(session.status=="unauthenticated"){
      router.push("/login")
    }
    else if(session.status=="authenticated"){
      router.push("/dashboard")
    }
  },[session])
  return null
}
