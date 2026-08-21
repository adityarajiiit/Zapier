import jwt from 'jsonwebtoken';
import { FastifyRequest, FastifyReply } from 'fastify';

export const verifyToken=async(req:any,reply:any)=>{
    let token=null
    const header=req.headers.authorization
    if(header&&header.startsWith('Bearer ')){
        token=header.split(' ')[1]
    }
    else if(req.query&&req.query.token){
        token=req.query.token
    }

    if(token){
        const secret=process.env.AUTH_SECRET
        if(!secret){
            return reply.status(500).send({error:'server error'})
        }
        try{
            const decoded=jwt.verify(token,secret) as any
            if(decoded&&decoded.id){
                req.userId=decoded.id
            }
        }
        catch{
            return reply.status(401).send({error:'invalid token'})
        }
    }
}
