import jwt from 'jsonwebtoken';
import { FastifyRequest, FastifyReply } from 'fastify';

export const verifyToken=async(req:any,reply:any)=>{
    const header=req.headers.authorization
    if(header&&header.startsWith('Bearer ')){
        const token:any=header.split(' ')[1]
        try{
            const secret=process.env.AUTH_SECRET
            if(secret){
                const decoded=jwt.verify(token,secret) as any
                if(decoded && decoded.id){
                    req.userId=decoded.id
                }
            }
        }
        catch(e:any){
            console.log(e.message)
        }
    }
}
