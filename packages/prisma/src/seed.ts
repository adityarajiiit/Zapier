import{seed} from './seed-oauth.js'
import{prisma} from'./index.js'

export const main=async()=>{
    try{
        await seed()
    }
    catch(e:any){
        console.log(e)
        process.exit(1)
    }
    finally{
        await prisma.$disconnect()
    }
}
main()