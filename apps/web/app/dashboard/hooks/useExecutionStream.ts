import{useEffect} from 'react'
import { api } from '../store/api'
import { useAppDispatch } from '../store/hook'
import { useSession } from 'next-auth/react'

export const useExecutionStream=(id:string,active:boolean)=>{
    const dispatch=useAppDispatch()
    const {data:session}=useSession() as any
    const token=session?.token

    useEffect(()=>{
        if(!active||!id||!token){
            return
        }
        const es=new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/executions/${id}/stream?token=${token}`,{
            withCredentials:true
        })
        es.addEventListener('update',(e:MessageEvent)=>{
            const data=JSON.parse(e.data)
            dispatch(api.util.updateQueryData('getExecution',id,()=>data))
        })
        es.addEventListener('done',()=>{
            es.close()
        })
        es.onerror=()=>es.close()
        return()=>{
            es.close()
        }
    },[id,active,dispatch])
}