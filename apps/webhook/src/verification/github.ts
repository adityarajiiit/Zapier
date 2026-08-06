import crypto from 'node:crypto'

export const verifyGithub=(body:Buffer,signature:string|null,secret:string)=>{
    if(!signature){
        return false
    }
    const expected='sha256='+crypto.createHmac('sha256',secret).update(body).digest('hex')
    try{
    return crypto.timingSafeEqual(
        Buffer.from(expected,'utf8'),
        Buffer.from(signature,'utf8')
    )
    }
    catch{
        return false
    }
}