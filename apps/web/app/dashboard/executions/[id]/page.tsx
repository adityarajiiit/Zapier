'use client'
import{use} from 'react'
import { useGetExecutionQuery } from '../../store/api'
import { useGetWorkflowQuery } from '../../store/api'
import { JsonViewer } from '../../components/ui/JsonViewer'
import { AlertTriangle,CheckCircle2,XCircle,Loader2,Clock,ChevronLeft } from 'lucide-react'
import{useRouter} from 'next/navigation'
import{useExecutionStream} from '../../hooks/useExecutionStream'
import{LoadingScreen} from '@/components/ui/loading-screen'
import{ErrorAlert} from '@/components/ui/error-alert'
const statusBadge:Record<string,string>={
    PENDING:'badge-warning',
    RUNNING:'badge-info',
    COMPLETED:'badge-success',
    FAILED:'badge-error',
    CANCELLED:'badge-ghost',
    SKIPPED:'badge-ghost',
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

export default function ExecutionDetailPage({params}:{params:Promise<{id:string}>}){
    const{id}=use(params)
    const router=useRouter()
    const{data:execution,isLoading}=useGetExecutionQuery(id)
    const{data:workflow}=useGetWorkflowQuery(execution?.workflowId||'',{
        skip:!execution?.workflowId
    })
    const isLive=execution?.status==='RUNNING'||execution?.status==='PENDING'
    useExecutionStream(id,!!isLive)
    if(isLoading)return <LoadingScreen />
    if(!execution)return <ErrorAlert title="Execution not found" />
    const steps=execution.stepResults||[]
    return(
        <div className='relative min-h-screen bg-base-100 px-4 py-8 sm:px-6 lg:px-8 lg:py-12'>
            <div className='mx-auto max-w-3xl'>
                <button
                className='flex items-center gap-1 text-sm text-base-content/40 hover:text-base-content transition-colors mb-6'
                onClick={()=>router.push('/dashboard/executions')}
                >
                    <ChevronLeft className='h-4 w-4'/>All Executions
                </button>
                <div className='mb-8 flex items-start justify-between gap-4'>
                    <div>
                        <h1 className='text-2xl font-bold text-base-content'>
                            {workflow?.name||'Execution Detail'}
                        </h1>
                        <p className='mt-1 text-sm text-base-content/40'>
                            {duration(execution.startedAt,execution.finishedAt)}
                        </p>
                    </div>
                    <div className='flex flex-col items-end gap-2 shrink-0'>
                        <span className={`badge badge-md ${statusBadge[execution.status]||'badge-ghost'}`}>
                            {execution.status}
                        </span>
                        {isLive&&(
                            <span className='flex items-center gap-1.5 text-xs text-info'>
                                <span className='h-1.5 w-1.5 rounded-full bg-info inline-block'/>
                                Live
                            </span>
                        )}
                    </div>
                </div>
                {execution.error&&(
                    <div className='alert alert-error mb-6 rounded-xl text-sm'>
                        <AlertTriangle className='h-4 w-4 shrink-0'/>
                        {execution.error}
                    </div>
                )}
                {steps.length===0?(
                    <div className="rounded-xl border border-white/[0.06] bg-base-200 p-12 text-center">
                        <Clock className="mx-auto h-8 w-8 text-base-content/20 mb-3"/>
                        <p className="text-sm text-base-content/40">
                        No step results recorded
                        </p>
                    </div>
                ):(
                    <div className="relative">
                        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-base-300"/>
                        <div className="flex flex-col">
                            {steps.map((step)=>(
                                <div key={step.id} className="relative pl-10 pb-6">
                                    <div className="absolute left-0 w-6 h-6 rounded-full flex items-center justify-center bg-base-300">
                                        {step.status==='COMPLETED'&&
                                           <CheckCircle2 className="h-3.5 w-3.5 text-success"/>}
                                        {step.status==='FAILED'&&
                                           <XCircle className="h-3.5 w-3.5 text-error"/>}
                                        {step.status==='RUNNING'&&
                                           <Loader2 className="h-3.5 w-3.5 text-info animate-spin"/>}
                                    </div>
                                    <div className="rounded-xl border border-white/[0.06] bg-base-200 p-4 flex flex-col gap-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-base-content">
                                                Step {step.stepOrder+1}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-base-content/40">
                                                    {duration(step.startedAt,step.finishedAt)}
                                                </span>
                                                <span className={`badge badge-sm ${statusBadge[step.status]||'badge-ghost'}`}>
                                                    {step.status}
                                                </span>
                                            </div>
                                        </div>
                                        {step.status==='FAILED'&&step.error&&(
                                            <div className="alert alert-error rounded-lg text-xs py-2">
                                                <AlertTriangle className="h-3.5 w-3.5 shrink-0"/>
                                                {step.error}
                                            </div>
                                        )}
                                        {(step.input||step.output)&&(
                                            <details className="collapse collapse-arrow bg-base-100 rounded-lg">
                                                <summary className="collapse-title text-xs font-semibold text-base-content/50 min-h-0 py-2 px-3">
                                                    Input / Output
                                                </summary>
                                                <div className="collapse-content flex flex-col gap-3 px-3 pb-3">
                                                    {step.input&&(
                                                        <div>
                                                            <p className="text-xs text-base-content/40 uppercase mb-1">Input</p>
                                                            <JsonViewer data={step.input}/>
                                                        </div>
                                                    )}
                                                    {step.output&&(
                                                        <div>
                                                            <p className="text-xs text-base-content/40 uppercase mb-1">Output</p>
                                                            <JsonViewer data={step.output}/>
                                                        </div>
                                                    )}
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            
        </div>
    )
}