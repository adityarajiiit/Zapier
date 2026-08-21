'use client'

import{useState} from 'react'
import axios from 'axios'
import{getSession} from 'next-auth/react'
import { useParams,useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import{toast} from 'sonner'
import {RiGeminiFill,RiNotionFill} from 'react-icons/ri'
import {FaSlack,FaGithub} from 'react-icons/fa'
import {SiGooglesheets,SiGmail} from 'react-icons/si'
import {BackgroundGradient} from '@/components/ui/background-gradient'
import {ShimmerButton} from '@/components/ui/shimmer-button'
import {useGetIntegrationQuery,useGetCredentialsQuery,useCreateCredentialMutation} from '../../store/api'
import{useForm} from 'react-hook-form'
import{zodResolver} from '@hookform/resolvers/zod'
import type { Integration } from '../../store/api'
import { apikeySchema,tokenSchema,type ApikeyForm,type TokenForm } from '../schema/credentialSchema'
import{LoadingScreen} from '@/components/ui/loading-screen'
import{ErrorAlert} from '@/components/ui/error-alert'
const icons:Record<string,React.ReactNode>={
  gmail:<SiGmail className="h-8 w-8"/>,
  github:<FaGithub className="h-8 w-8"/>,
  slack:<FaSlack className="h-8 w-8"/>,
  gemini:<RiGeminiFill className="h-8 w-8"/>,
  googlesheets:<SiGooglesheets className="h-8 w-8"/>,
  notion:<RiNotionFill className="h-8 w-8"/>,
}
function getIcon(id:string){
  return icons[id.toLowerCase()]||null
}

export default function IntegrationDetailPage(){
    const{id}=useParams<{id:string}>()
    const router=useRouter()
    const{data:integration,isLoading,isError}=useGetIntegrationQuery(id)
    const{data:credentials=[]}=useGetCredentialsQuery()
    const[createCredential,{isLoading:saving}]=useCreateCredentialMutation()
    const[activeTab,setActiveTab]=useState<'triggers'|'actions'>('triggers')
    const[modalOpen,setModalOpen]=useState(false)
    const connected=credentials.some((c)=>c.integrationId===id)
    const authType=integration?.authType
    const apikeyForm=useForm<ApikeyForm>({resolver:zodResolver(apikeySchema)})
    const tokenForm=useForm<TokenForm>({resolver:zodResolver(tokenSchema)})
    const handleConnectClick=async()=>{
        if(authType==='OAUTH2'){
            try{
                const session=await getSession() as any
                const token=session?.token
                const{data}=await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/oauth/connect/${id}`,{
                    headers:token?{Authorization:`Bearer ${token}`}:{}
                })
                window.location.href=data.url
            
            }catch(e:any){
                toast.error(e.data?.error)
            }
        }else{
            setModalOpen(true)
        }
    }

    const handleApikeySubmit=apikeyForm.handleSubmit(async(data)=>{
        try{
            await createCredential({label:data.label,integrationId:id,authType:'APIKEY',apiKey:data.apiKey}).unwrap()
            toast.success(`${integration?.name} connected`)
            apikeyForm.reset()
            setModalOpen(false)
        
        }
        catch(e:any){
            toast.error(e.message)
        }
    })

    const handleTokenSubmit=tokenForm.handleSubmit(async(data)=>{
        try{
            await createCredential({label:data.label,integrationId:id,authType:'TOKEN',bearerToken:data.bearerToken}).unwrap()
            toast.success(`${integration?.name} connected`)
            tokenForm.reset()
            setModalOpen(false)
        }
        catch(e:any){
            toast.error(e.message)
        }
    })
    if(isLoading)return <LoadingScreen />
    if(isError||!integration)return <ErrorAlert title="Integration not found" />
    const triggers=integration?.triggers||[]
    const actions=integration?.actions||[]
    return(
        <div className='relative min-h-screen bg-base-100 px-4 py-8 sm:px-6 lg:px-8 lg:py-12'>
            <div className='mx-auto max-w-3xl'>
                <button
                className='mb-8 flex items-center gap-1.5 text-sm text-base-content/50 hover:text-base-content'
                onClick={()=>router.back()}
                >
                <ArrowLeft className='h-4 w-4'/>
                Back
                </button>
                <BackgroundGradient className='rounded-2xl p-px'>
                    <div className='rounded-2xl border border-white/10 bg-base-200 p-8'>
                         <div className='flex items-start justify-between'>
                             <div className='flex items-center gap-4'>
                                 <div className='flex h-14 w-14 items-center justify-center rounded-xl bg-base-300 text-base-content/70'>
                                    {getIcon(integration.id)}
                                 </div>
                                 <div>
                                   <h1 className='text-2xl font-bold text-base-content'>
                                    {integration.name}
                                   </h1>
                                   {integration.description&&(<p className='mt-1 text-sm text-base-content/50'>
                                    {integration.description}
                                   </p>)}
                                 </div>
                             </div>
                             <span className={`badge badge-sm ${
                                    connected?'badge-success':'badge-ghost'
                             }`}>
                                    {connected?'Connected':'Not connected'}
                             </span>
                         </div>
                         <div className='mt-8'>
                             {connected?(
                                 <span className='text-sm text-success'>Connected</span>
                             ):authType==='NONE'?null:(
                                 <ShimmerButton onClick={handleConnectClick} className='px-4 py-2 text-sm font-semibold'>
                                     {authType==='OAUTH2'?`Connect with ${integration?.name}`:authType==='APIKEY'?'Add API Key':'Add Bearer Token'}
                                 </ShimmerButton>
                             )}
                         </div>
                         <div role="tablist" className='tabs tabs-bordered mt-8'>
                              <button
                              role="tab"
                              className={`tab ${activeTab==='triggers'?'tab-active':''}`}
                              onClick={()=>setActiveTab('triggers')}
                              >
                              Triggers ({triggers.length})
                              </button>
                              <button
                              role="tab"
                              className={`tab ${activeTab==='actions'?'tab-active':''}`}
                              onClick={()=>setActiveTab('actions')}
                              >
                              Actions ({actions.length})
                              </button>
                         </div>
                         <div className='mt-4'>
                            {activeTab==='triggers'&&(
                                triggers.length===0?(
                                    <p className='py-8 text-center text-sm text-base-content/40'>
                                        No triggers available for {integration.name}
                                    </p>
                                ):(
                                    triggers.map((t)=>(
                                        <div key={t.id} className='flex items-start gap-4 border-b border-white/10 py-4 last:border-0'>
                                            <div className='min-w-0 flex-1'>
                                                <p className='text-sm font-medium text-base-content'>{t.name}</p>
                                                <p className='mt-1 text-xs text-base-content/40'>
                                                    {t.description}
                                                </p>
                                            </div>
                                            <span className='badge badge-info badge-sm shrink-0'>
                                                Trigger
                                            </span>
                                        </div>
                                    ))
                                )
                            )}
                            {activeTab==='actions'&&(
                                actions.length===0?(
                                    <p className='py-8 text-center text-sm text-base-content/40'>
                                        No actions available for {integration.name}
                                    </p>
                                ):(
                                    actions.map((a)=>(
                                        <div key={a.id} className='flex items-start gap-4 border-b border-white/10 py-4 last:border-0'>
                                            <div className='min-w-0 flex-1'>
                                                <p className='text-sm font-medium text-base-content'>{a.name}</p>
                                                {a.description&&(
                                                    <p className='mt-1 text-xs text-base-content/40'>
                                                    {a.description}
                                                </p>
                                                )}
                                            </div>
                                            <span className='badge badge-info badge-sm shrink-0'>
                                                Action
                                            </span>
                                        </div>
                                    ))
                                )
                            )}
                         </div>
                    </div>
                </BackgroundGradient>
            </div>
            {(authType==='APIKEY'||authType==='TOKEN')&&(
                <dialog className={`modal modal-middle ${modalOpen?'modal-open':''}`}>
                    <div className='modal-box max-w-md rounded-2xl border border-white/10 bg-base-300'>
                        <h3 className='text-base font-semibold text-base-content'>
                            Connect {integration?.name}
                        </h3>
                        {authType==='APIKEY'?(
                            <form onSubmit={handleApikeySubmit} className='mt-5 flex flex-col gap-4'>
                                <div>
                                    <label className='label pb-1'>
                                        <span className='label-text text-base-content'>
                                            Label
                                        </span>
                                    </label>
                                    <input
                                        className='input input-bordered w-full text-sm'
                                        placeholder='My credential'
                                        {...apikeyForm.register('label')}
                                    />
                                    {apikeyForm.formState.errors.label?.message&&<p className='mt-1 text-xs text-error'>
                                        {apikeyForm.formState.errors.label.message}
                                    </p>}
                                </div>
                                <div>
                                    <label className='label pb-1'>
                                        <span className='label-text text-base-content'>
                                            API Key
                                        </span>
                                    </label>
                                    <input
                                        className='input input-bordered w-full text-sm'
                                        type='password'
                                        placeholder='API Key here'
                                        {...apikeyForm.register('apiKey')}
                                    />
                                    {apikeyForm.formState.errors.apiKey?.message&&<p className='mt-1 text-xs text-error'>
                                        {apikeyForm.formState.errors.apiKey.message}
                                    </p>}
                                </div>
                                <div className='modal-action mt-2'>
                                    <button type='button' className='btn btn-ghost btn-sm' onClick={()=>setModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button type='submit' className='btn btn-primary btn-sm' disabled={saving}>
                                        {saving?<span className='loading loading-spinner loading-xs'/>:null}Save
                                    </button>
                                </div>
                            </form>
                        ):(
                            <form onSubmit={handleTokenSubmit} className='mt-5 flex flex-col gap-4'>
                                <div>
                                    <label className='label pb-1'>
                                        <span className='label-text text-base-content'>
                                            Label
                                        </span>
                                    </label>
                                    <input
                                        className='input input-bordered w-full text-sm'
                                        placeholder='My credential'
                                        {...tokenForm.register('label')}
                                    />
                                    {tokenForm.formState.errors.label?.message&&<p className='mt-1 text-xs text-error'>
                                        {tokenForm.formState.errors.label.message}
                                    </p>}
                                </div>
                                <div>
                                    <label className='label pb-1'>
                                        <span className='label-text text-base-content'>Bearer Token</span>
                                    </label>
                                    <input
                                        className='input input-bordered w-full text-sm'
                                        type='password'
                                        placeholder='Bearer Token here'
                                        {...tokenForm.register('bearerToken')}
                                    />
                                    {tokenForm.formState.errors.bearerToken?.message&&<p className='mt-1 text-xs text-error'>
                                        {tokenForm.formState.errors.bearerToken.message}
                                    </p>}
                                </div>
                                <div className='modal-action mt-2'>
                                    <button type='button' className='btn btn-ghost btn-sm' onClick={()=>setModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button type='submit' className='btn btn-primary btn-sm' disabled={saving}>
                                        {saving?
                                            <span className='loading loading-spinner loading-xs'/>
                                        :null}
                                        Save
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </dialog>
            )}
        </div>
    )    

}