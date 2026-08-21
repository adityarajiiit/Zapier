'use client'
import{useRouter} from 'next/navigation'
import{useState} from 'react'
import{useGetExecutionsQuery,useGetWorkflowsQuery} from '../store/api'
import{TextGenerateEffect} from '@/components/ui/text-generate-effect'
import{Activity} from 'lucide-react'
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

export default function ExecutionsPage(){
    const router=useRouter()
    const[statusFilter,setStatusFilter]=useState('')
    const[workflowFilter,setWorkflowFilter]=useState('')
    const{data:workflows=[]}=useGetWorkflowsQuery()
    const{data:executions=[],isLoading,isError}=useGetExecutionsQuery(
        workflowFilter?{workflowId:workflowFilter}:undefined
    )
    const filtered=statusFilter?executions.filter(e=>e.status===statusFilter):executions
    if(isLoading)return <LoadingScreen />
    if(isError)return <ErrorAlert />
    return(
        <div className="relative min-h-screen bg-base-100 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <TextGenerateEffect
                        words="Execution History"
                        className="text-3xl font-bold text-base-content lg:text-4xl"
                        />
                        <p className="mt-2 text-sm text-base-content/50">
                            View all workflow runs and their results
                        </p>
                    </div>
                </div>
                <div className="mb-4 flex flex-wrap gap-3">
                    <select
                    className="select select-bordered select-sm"
                    value={statusFilter}
                    onChange={(e)=>setStatusFilter(e.target.value)}
                    >
                        <option value=''>All Statuses</option>
                        <option value='PENDING'>Pending</option>
                        <option value='RUNNING'>Running</option>
                        <option value='COMPLETED'>Completed</option>
                        <option value='FAILED'>Failed</option>
                        <option value='CANCELLED'>Cancelled</option>
                    </select>
                    <select
                    className="select select-bordered select-sm"
                    value={workflowFilter}
                    onChange={(e)=>setWorkflowFilter(e.target.value)}
                    >
                        <option value=''>All Workflows</option>
                        {workflows.map((w)=>(
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>
                </div>
                <div className="rounded-xl border border-white/10 bg-base-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="table table-sm w-full">
                            <thead>
                                <tr className="border-white/10">
                                    <th className="text-xs text-base-content/40 uppercase font-semibold">Workflow</th>
                                    <th className="text-xs text-base-content/40 uppercase font-semibold">Status</th>
                                    <th className="text-xs text-base-content/40 uppercase font-semibold">Triggered At</th>
                                    <th className="text-xs text-base-content/40 uppercase font-semibold">Duration</th>
                                    <th className="text-xs text-base-content/40 uppercase font-semibold">Steps</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length===0?(
                                    <tr>
                                        <td colSpan={5}>
                                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                                <Activity className="h-8 w-8 text-base-content/20"/>
                                                <p className="text-sm text-base-content/40">No executions found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ):(
                                    filtered.map(e=>{
                                        const wf=workflows.find(w=>w.id===e.workflowId)
                                        return(
                                            <tr
                                            key={e.id}
                                            className="border-white/10 hover:bg-white/5 cursor-pointer transition-colors"
                                            onClick={()=>router.push(`/dashboard/executions/${e.id}`)}
                                            >
                                                <td className="text-sm font-medium text-base-content">
                                                    {wf?.name||'Unknown Workflow'}
                                                </td>
                                                <td>
                                                    <span className={`badge badge-sm ${statusBadge[e.status]||'badge-ghost'}`}>
                                                        {e.status}
                                                    </span>
                                                </td>
                                                <td className="text-xs text-base-content/50">
                                                    {e.startedAt
                                                        ?new Date(e.startedAt).toLocaleString()
                                                        :new Date(e.createdAt).toLocaleString()
                                                    }
                                                </td>
                                                <td className="text-xs text-base-content/50">
                                                    {duration(e.startedAt,e.finishedAt)}
                                                </td>
                                                <td className="text-xs text-base-content/50">
                                                    {e.stepResults?.length??'—'}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}