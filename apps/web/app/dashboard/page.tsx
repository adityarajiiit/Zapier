'use client'

import Link from 'next/link'
import {useRouter} from 'next/navigation'
import type {LucideIcon} from 'lucide-react'
import {
  Plus,
  Workflow as WorkflowIcon,
  Zap,
  Activity,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Boxes,
  KeyRound,
  ListTree,
  ArrowRight,
} from 'lucide-react'

import {BackgroundBeams} from '@/components/ui/background-beams'
import {TextGenerateEffect} from '@/components/ui/text-generate-effect'
import {ShimmerButton} from '@/components/ui/shimmer-button'
import {NumberTicker} from '@/components/ui/number-ticker'

import {useGetWorkflowsQuery,useGetExecutionsQuery} from './store/api'
import {LoadingScreen} from '@/components/ui/loading-screen'
import {ErrorAlert} from '@/components/ui/error-alert'

type ExecutionStatus='COMPLETED'|'FAILED'|'RUNNING'|'PENDING'|'CANCELLED'

function getStatus(status:string){
  switch(status){
    case 'COMPLETED':
      return{
        label:'Completed',
        Icon:CheckCircle2,
        iconClass:'text-success',
        labelClass:'text-success',
        barClass:'bg-success'
      }
    case 'FAILED':
      return{
        label:'Failed',
        Icon:XCircle,
        iconClass:'text-error',
        labelClass:'text-error',
        barClass:'bg-error'
      }
    case 'RUNNING':
      return{
        label:'Running',
        Icon:Loader2,
        iconClass:'text-info animate-spin',
        labelClass:'text-info',
        barClass:'bg-info'
      }
    case 'CANCELLED':
      return{
        label:'Cancelled',
        Icon:XCircle,
        iconClass:'text-base-content/50',
        labelClass:'text-base-content/50',
        barClass:'bg-base-content/30'
      }
    case 'PENDING':
    default:
      return{
        label:'Pending',
        Icon:Clock,
        iconClass:'text-warning',
        labelClass:'text-warning',
        barClass:'bg-warning'
      }
  }
}

function StatCard({
  icon:Icon,
  label,
  subtext,
  value,
  decimalPlaces=0,
  suffix='',
  accentClass='text-base-content',
  borderClass='bg-white/30',
}:{
  icon:LucideIcon
  label:string
  subtext:string
  value:number
  decimalPlaces?:number
  suffix?:string
  accentClass?:string
  borderClass?:string
}){
  return(
    <div className="relative flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-base-200 p-5">
      <div className={`absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full ${borderClass}`} />
      <div className="flex items-center justify-between pl-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-base-content/40">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${accentClass}`} strokeWidth={1.75} />
      </div>
      <div className="pl-3 flex items-baseline gap-1">
        <NumberTicker
          value={value}
          decimalPlaces={decimalPlaces}
          className="text-4xl font-semibold tracking-tight text-base-content tabular-nums"
        />
        {suffix&&<span className="text-2xl font-semibold text-base-content/60">{suffix}</span>}
      </div>
      <p className="pl-3 text-xs text-base-content/35">{subtext}</p>
    </div>
  )
}

function SkeletonStatCard(){
  return(
    <div className="relative flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-base-200 p-5">
      <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-white/10" />
      <div className="flex items-center justify-between pl-3">
        <div className="skeleton h-2 w-24 rounded" />
        <div className="skeleton h-4 w-4 rounded" />
      </div>
      <div className="pl-3 skeleton h-10 w-16 rounded-md" />
      <div className="pl-3 skeleton h-3 w-28 rounded" />
    </div>
  )
}

export default function DashboardPage(){
  const router=useRouter()

  const{data:wfs=[],isLoading:wfsLoading,isError:wfsError}=useGetWorkflowsQuery()
  const{data:runs=[],isLoading:runsLoading,isError:runsError}=useGetExecutionsQuery()
  const loading=wfsLoading||runsLoading
  if(loading)return <LoadingScreen />
  if(wfsError||runsError)return <ErrorAlert />
  const wfNames=new Map<string,string>()
  wfs.forEach((w)=>wfNames.set(w.id,w.name))
  const totalWfs=wfs.length
  const activeWfs=wfs.filter((w)=>w.isActive).length
  const runsToday=runs.filter((e)=>{
    if(!e.startedAt) return false
    const d=new Date(e.startedAt)
    const now=new Date()
    return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()&&d.getDate()===now.getDate()
  }).length
  const finished=runs.filter((e)=>e.status==='COMPLETED'||e.status==='FAILED')
  const successful=finished.filter((e)=>e.status==='COMPLETED').length
  const rate=finished.length===0?0:Math.round((successful/finished.length)*1000)/10
  const rateAccent=rate>=90
    ?{
      accentClass:'text-success',
      borderClass:'bg-success'
    }
    :rate>=70
    ?{
      accentClass:'text-warning',
      borderClass:'bg-warning'
    }
    :{
      accentClass:'text-error',
      borderClass:'bg-error'
    }
  const recent=[...runs]
    .sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())
    .slice(0,5)
  const quickLinks=[
    {
      href:'/dashboard/workflows/new',
      title:'Create Workflow',
      subtitle:'Start automating from scratch',
      icon:Plus,
      featured:true
    },
    {
      href:'/dashboard/integrations',
      title:'Browse Integrations',
      subtitle:'Connect the apps you rely on',
      icon:Boxes,
      featured:false
    },
    {
      href:'/dashboard/credentials/new',
      title:'Add Credential',
      subtitle:'Store an API key or auth token',
      icon:KeyRound,
      featured:false
    },
    {
      href:'/dashboard/executions',
      title:'View Executions',
      subtitle:'Audit every workflow run',
      icon:ListTree,
      featured:false
    },
  ]

  return(
    <div className="relative min-h-screen w-full bg-base-100">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <BackgroundBeams className="opacity-30" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end lg:mb-12">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-base-content/40">Dashboard</p>
            <TextGenerateEffect
              words="Here's what's running in your workspace"
              className="text-2xl font-bold tracking-tight text-base-content sm:text-3xl lg:text-4xl"
            />
            <p className="mt-2 text-sm text-base-content/50">
              {totalWfs} workflow{totalWfs===1?'':'s'} &middot; {activeWfs} active right now
            </p>
          </div>
          <ShimmerButton
            onClick={()=>router.push('/dashboard/workflows/new')}
            className="shrink-0 px-5 py-2.5 text-sm font-semibold"
          >
            <span className="flex items-center gap-2 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              Create Workflow
            </span>
          </ShimmerButton>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:mb-8 lg:grid-cols-4 lg:gap-4">
          <>
            <StatCard icon={WorkflowIcon}
            label="Total Workflows"
            subtext="Across your workspace"
            value={totalWfs}
            accentClass="text-primary"
            borderClass="bg-primary" />
            <StatCard
            icon={Zap}
            label="Active Workflows"
            subtext={`Of ${totalWfs} total`}
            value={activeWfs}
            accentClass="text-success"
            borderClass="bg-success" />
            <StatCard
            icon={Activity}
            label="Executions Today"
            subtext="Since midnight"
            value={runsToday}
            accentClass="text-info"
            borderClass="bg-info" />
            <StatCard
            icon={TrendingUp}
            label="Success Rate"
            subtext="Of completed runs"
            value={rate}
            decimalPlaces={1}
            suffix="%"
            accentClass={rateAccent.accentClass}
            borderClass={rateAccent.borderClass} />
          </>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-white/[0.06] bg-base-200 p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-base-content/40">
                Live activity
                </p>
                <h2 className="mt-1 text-sm font-semibold text-base-content">
                  Recent Executions
                </h2>
              </div>
              <Link href="/dashboard/executions" className="flex items-center gap-1 text-xs font-medium text-base-content/50 hover:text-base-content">
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {recent.length===0?(
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <Activity className="h-5 w-5 text-base-content/25" />
                <p className="text-xs text-base-content/40">No executions yet</p>
              </div>
            ):(
              <ul className="divide-y divide-white/[0.04]">
                {recent.map((execution)=>{
                  const meta=getStatus(execution.status)
                  const durationMs=execution.finishedAt&&execution.startedAt
                    ?new Date(execution.finishedAt).getTime()-new Date(execution.startedAt).getTime()
                    :null
                  const duration=durationMs!==null
                    ?durationMs<1000?`${durationMs}ms`:`${(durationMs/1000).toFixed(1)}s`
                    :null
                  const wfName=wfNames.get(execution.workflowId)||'Untitled workflow'
                  return(
                    <li key={execution.id}>
                      <Link href={`/dashboard/executions/${execution.id}`} className="flex items-center gap-3 rounded-lg px-1 py-3 hover:bg-base-300/40">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${meta.barClass}`} />
                        <span className="min-w-0 flex-1 truncate text-sm text-base-content">{wfName}</span>
                        <span className="flex items-center gap-2 shrink-0">
                          {duration&&<span className="text-xs text-base-content/35">{duration}</span>}
                          <span className={`text-xs font-medium ${meta.labelClass}`}>{meta.label}</span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-base-200 p-5 lg:col-span-1">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-base-content/40">
            Quick Actions
            </p>
            <div className="divide-y divide-white/[0.04]">
              {quickLinks.map((link)=>(
                <Link key={link.href} href={link.href} className="flex items-center gap-3 rounded-lg px-1 py-3 hover:bg-base-300/40">
                  <link.icon
                   className={`h-4 w-4 shrink-0 ${link.featured?'text-base-content':'text-base-content/50'}`}
                   strokeWidth={1.75} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-base-content">
                      {link.title}
                    </span>
                    <span className="block text-xs text-base-content/40">
                      {link.subtitle}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}