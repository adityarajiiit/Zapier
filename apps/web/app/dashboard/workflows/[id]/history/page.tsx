'use client'
import{useRouter} from 'next/navigation'
import{use} from 'react'
import{useGetWorkflowQuery,useGetExecutionsQuery} from '../../../store/api'
import{ChevronLeft} from 'lucide-react'
import{LoadingScreen} from '@/components/ui/loading-screen'
import{ErrorAlert} from '@/components/ui/error-alert'

const statusBadge:Record<string,string>={
    PENDING:'badge-warning',
    RUNNING:'badge-info',
    COMPLETED:'badge-success',
    FAILED:'badge-error',
    CANCELLED:'badge-ghost',
}

const duration=(start?:string,end?:string)=>{
    if(!start||!end){
        return '—'
    }
    const ms=new Date(end).getTime()-new Date(start).getTime()
    if(ms<1000){
        return `${ms}ms`
    }
    return `${(ms/1000).toFixed(1)}s`
}

export default function WorkflowHistoryPage({params}:{params:Promise<{id:string}>}){
    const{id}=use(params)
    const router=useRouter()
    const{data:workflow}=useGetWorkflowQuery(id)
    const{data:executions=[],isLoading,isError}=useGetExecutionsQuery({workflowId:id})
    if(isLoading)return <LoadingScreen />
    if(isError)return <ErrorAlert />
    return(
        <div className='relative min-h-screen bg-base-100 px-4 py-8 sm:px-6 lg:px-8 lg:py-12'>
            <div className='mx-auto max-w-6xl'>
                <div className='mb-8'>
                    <button
                    className='flex items-center gap-1 text-sm text-base-content/40 hover:text-base-content transition-colors mb-4'
                    onClick={()=>router.push(`/dashboard/workflows/${id}`)}
                    >
                        <ChevronLeft className='h-4 w-4'/>
                        Back to workflow
                    </button>
                    <h1 className='text-3xl font-bold text-base-content'>
                        {workflow?.name||'Workflow'} — Run History
                    </h1>
                    <p className='mt-2 text-sm text-base-content/50'>
                        All execution runs for this workflow
                    </p>
                </div>
                <div className='rounded-xl border border-white/10 bg-base-200 overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <table className='table table-sm w-full'>
                            <thead>
                                <tr className='border-white/10'>
                                    <th className='text-xs text-base-content/40 uppercase font-semibold'>Run ID</th>
                                    <th className='text-xs text-base-content/40 uppercase font-semibold'>Status</th>
                                    <th className='text-xs text-base-content/40 uppercase font-semibold'>Triggered At</th>
                                    <th className='text-xs text-base-content/40 uppercase font-semibold'>Duration</th>
                                    <th className='text-xs text-base-content/40 uppercase font-semibold'>Steps</th>
                                </tr>
                            </thead>
                            <tbody>
                                {executions.length===0?(
                                    <tr>
                                        <td colSpan={5}>
                                            <div className='flex flex-col items-center justify-center py-16 gap-3'>
                                                <p className='text-sm text-base-content/40'>No runs yet</p>
                                            </div>
                                        </td>
                                    </tr>
                                ):(
                                    executions.map(e=>(
                                        <tr
                                        key={e.id}
                                        className='border-white/10 hover:bg-white/5 cursor-pointer transition-colors'
                                        onClick={()=>router.push(`/dashboard/executions/${e.id}`)}
                                        >
                                            <td className='text-xs font-mono text-base-content/60'>
                                                {e.id.slice(0,8)}
                                            </td>
                                            <td>
                                                <span className={`badge badge-sm ${statusBadge[e.status]||'badge-ghost'}`}>
                                                    {e.status}
                                                </span>
                                            </td>
                                            <td className='text-xs text-base-content/50'>
                                                {e.startedAt
                                                    ?new Date(e.startedAt).toLocaleString()
                                                    :new Date(e.createdAt).toLocaleString()
                                                }
                                            </td>
                                            <td className='text-xs text-base-content/50'>
                                                {duration(e.startedAt,e.finishedAt)}
                                            </td>
                                            <td className='text-xs text-base-content/50'>
                                                {e.stepResults?.length||'—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}