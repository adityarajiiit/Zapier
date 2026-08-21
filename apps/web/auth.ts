import NextAuth from "next-auth";
import Github from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import jwt from "jsonwebtoken";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@repo/prisma";

export const {auth,handlers,signIn,signOut}=NextAuth({
  adapter: PrismaAdapter(prisma),
  providers:[Github,Google],
  session:{strategy:"jwt"},
  callbacks:{
    jwt:({token,user})=>{
      if(user){
        token.id=user.id
      }
      return token
    },
    session:({session,token})=>{
      if(session.user&&token.id){
        session.user.id=token.id as string
        const secret=process.env.AUTH_SECRET
        if(secret){
          (session as any).token=jwt.sign({id:token.id},secret,{expiresIn:'1d'})
        }
      }
      return session
    }
  }
})