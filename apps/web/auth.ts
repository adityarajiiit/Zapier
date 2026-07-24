import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@repo/prisma";
import Github from "next-auth/providers/github"

export const {auth,handlers,signIn,signOut}=NextAuth({
  adapter:PrismaAdapter(prisma),
  providers:[Github],
  callbacks:{
    session:({session,user})=>{
      if(session.user&&user){
        session.user.id=user.id
      }
      return session
    }
  }
})