import crypto from 'node:crypto'

const key=process.env.ENCRYPTION_KEY!
const keyBuffer=Buffer.from(key,'hex')
export const encrypt=async(text:string)=>{
    const iv=crypto.randomBytes(16)
    const cipher=crypto.createCipheriv('aes-256-gcm',keyBuffer,iv)
    let ciphertext=cipher.update(text,'utf-8')
    ciphertext=Buffer.concat([ciphertext,cipher.final()])
    const authTag=cipher.getAuthTag()
    const combined=Buffer.concat([iv,authTag,ciphertext])
    return combined.toString('base64')
}

export const decrypt=async(encryptBase64:string)=>{
    const data=Buffer.from(encryptBase64,'base64')
    const iv=data.subarray(0,16)
    const authTag=data.subarray(16,32)
    const ciphertext=data.subarray(32)
    const decipher=crypto.createDecipheriv('aes-256-gcm',keyBuffer,iv)
    decipher.setAuthTag(authTag)
    let text=decipher.update(ciphertext,undefined,'utf-8')
    text+=decipher.final('utf-8')
    return text
}