"use client"
import { signIn } from "next-auth/react";
import { FaGithub, FaGoogle } from "react-icons/fa";
export default function Login() {
    return (
        <div className="flex flex-col justify-center items-center h-screen gap-3">
            <button className="bg-gray-800 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2" onClick={()=>signIn("github",{redirectTo:"/dashboard"})}><FaGithub/>Login with GitHub</button>
            <button className="bg-white text-gray-800 border border-gray-300 px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2" onClick={()=>signIn("google",{redirectTo:"/dashboard"})}><FaGoogle/>Login with Google</button>
        </div>
    )
}