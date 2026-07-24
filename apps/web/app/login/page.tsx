"use client"
import { signIn } from "next-auth/react";
export default function Login() {
    return (
        <div className="flex justify-center items-center h-screen">
            <button className="bg-gray-800 text-white px-4 py-2 rounded-lg cursor-pointer" onClick={()=>signIn("github",{redirectTo:"/dashboard"})}>Login with GitHub</button>
        </div>
    )
}