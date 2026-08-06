import crypto from 'node:crypto'

export const verifySlack=(body:Buffer,signature:string|null,timestamp:string|null,secret:string)=>{
    if(!signature||!timestamp){
        return false
    }
    const now=Math.floor(Date.now()/1000)
    if(Math.abs(now-parseInt(timestamp))>300){
        return false
    }
    const sig=`v0:${timestamp}:${body.toString()}`
    const expected='v0='+crypto.createHmac('sha256',secret).update(sig).digest('hex')
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