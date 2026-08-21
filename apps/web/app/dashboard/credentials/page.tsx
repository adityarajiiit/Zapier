'use client'
import { useState } from 'react'
import axios from 'axios'
import { getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Trash2, KeyRound, ShieldCheck, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'
import { RiGeminiFill, RiNotionFill } from 'react-icons/ri'
import { FaSlack, FaGithub } from 'react-icons/fa'
import { SiGooglesheets, SiGmail } from 'react-icons/si'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { useGetCredentialsQuery, useGetIntegrationsQuery, useCreateCredentialMutation, useDeleteCredentialMutation } from '../store/api'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { ErrorAlert } from '@/components/ui/error-alert'
import { apikeySchema, tokenSchema, type ApikeyForm, type TokenForm } from '../integrations/schema/credentialSchema'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AuthType } from '../store/api'

const icons:Record<string,React.ReactNode>={
    gmail:<SiGmail className="h-4 w-4"/>,
    github:<FaGithub className="h-4 w-4"/>,
    slack:<FaSlack className="h-4 w-4"/>,
    gemini:<RiGeminiFill className="h-4 w-4"/>,
    googlesheets:<SiGooglesheets className="h-4 w-4"/>,
    notion:<RiNotionFill className="h-4 w-4"/>,
}
function getIcon(id:string){
    return icons[id.toLowerCase()]||<KeyRound className="h-4 w-4"/>
}

function authBadge(authType:string){
    if(authType==='OAUTH2'){
        return(
            <span className="badge badge-info badge-sm">
                OAuth2
            </span>
        )
    }
    if(authType==='APIKEY'){
        return(
            <span className="badge badge-warning badge-sm">
                API Key
            </span>
        )
    }
    if(authType==='TOKEN'){
        return(
            <span className="badge badge-ghost badge-sm">
                Token
            </span>
        )
    }
    return null
}


export default function CredentialsPage(){
    const router=useRouter()
    const{data:credentials=[],isLoading,isError}=useGetCredentialsQuery()
    const{data:integrations=[]}=useGetIntegrationsQuery()
    const[deleteCredential,{isLoading:deleting}]=useDeleteCredentialMutation()
    const[createCredential,{isLoading:saving}]=useCreateCredentialMutation()
    const[addDialogOpen,setAddDialogOpen]=useState(false)
    const[deleteDialogOpen,setDeleteDialogOpen]=useState(false)
    const[deleteId,setDeleteId]=useState<string|null>(null)
    const[selectedIntegrationId,setSelectedIntegrationId]=useState('')
    const selectedIntegration=integrations.find((i)=>i.id===selectedIntegrationId)
    const authType=selectedIntegration?.authType as AuthType|null
    const apikeyForm=useForm<ApikeyForm>({resolver:zodResolver(apikeySchema)})
    const tokenForm=useForm<TokenForm>({resolver:zodResolver(tokenSchema)})
    const openDelete=(id:string)=>{
        setDeleteId(id)
        setDeleteDialogOpen(true)
    }
    const handleDelete=async()=>{
        if(!deleteId){
            return
        }
        try{
            await deleteCredential(deleteId).unwrap()
            toast.success("Credential deleted")
            setDeleteDialogOpen(false)
            setDeleteId(null)
        }
        catch(e:any){
            toast.error(e.data?.error)
        }
    }
    const handleApikeySubmit=apikeyForm.handleSubmit(async(data)=>{
        try{
            await createCredential({
                label:data.label,
                integrationId:selectedIntegrationId,
                authType:'APIKEY',
                apiKey: data.apiKey,
            }).unwrap()
            toast.success("API key added")
            apikeyForm.reset()
            setAddDialogOpen(false)
        }
        catch(e:any){
            toast.error(e.data?.error)
        }
    })

    const handleTokenSubmit=tokenForm.handleSubmit(async(data)=>{
        try {
            await createCredential({
                label:data.label,
                integrationId:selectedIntegrationId,
                authType:'TOKEN',
                bearerToken:data.bearerToken
            }).unwrap()
            toast.success("Token added")
            tokenForm.reset()
            setAddDialogOpen(false)
        }
        catch(e:any){
            toast.error(e.data?.error)
        }
    })

    const handleOauthConnect=async()=>{
        if(!selectedIntegrationId){
            return
        }
        try{
            const session=await getSession() as any
            const token=session?.token
            const {data}=await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/oauth/connect/${selectedIntegrationId}`,{
                headers:token ?{Authorization:`Bearer ${token}`}:{}
            })
            window.location.href=data.url
        }
        catch(e:any){
            toast.error(e.data?.error)
        }
    }
    if(isLoading)return <LoadingScreen />
    if(isError)return <ErrorAlert />
    return (
        <div className='relative min-h-screen bg-base-100 px-4 py-8 sm:px-6 lg:px-8 lg:py-12'>
            <div className='mx-auto max-w-6xl'>
                <div className='mb-8 flex items-start justify-between'>
                    <div>
                        <TextGenerateEffect
                            words='Credentials'
                            className='text-3xl font-bold text-base-content lg:text-4xl'
                        />
                        <p className='mt-2 text-sm text-base-content/50'>
                            Manage your integration credentials
                        </p>
                    </div>
                    <ShimmerButton
                        className='px-4 py-2 text-sm font-semibold'
                        onClick={() => setAddDialogOpen(true)}
                    >
                        Add Credential
                    </ShimmerButton>
                </div>
                <div className='surface-card overflow-hidden'>
                    {credentials.length === 0 ? (
                        <div className='flex flex-col items-center justify-center gap-3 py-24 text-center'>
                            <KeyRound className='h-6 w-6 text-base-content/25' />
                            <p className='text-sm text-base-content/40'>
                                No credential yet
                            </p>
                        </div>
                    ) : (
                        <table className='table table-zebra w-full'>
                                <thead>
                                    <tr>
                                        <th>Integration</th>
                                        <th>Label</th>
                                        <th>Auth Type</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {credentials.map((cred) => (
                                        <tr key={cred.id} className='hover:bg-base-300'>
                                            <td>
                                                <div className='flex items-center gap-2'>
                                                    <span className='text-base-content/60'>
                                                        {getIcon(cred.integrationId)}
                                                    </span>
                                                    <span className='text-sm text-base-content'>
                                                        {cred.integrationName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className='text-sm text-base-content/70'>
                                                {cred.label}
                                            </td>
                                            <td>
                                                {authBadge(cred.authType)}
                                            </td>
                                            <td>
                                                {cred.isValid ? (
                                                    <span className='text-xs text-success'>
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className='text-xs text-error'>
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td
                                                className='text-xs text-base-content/40'
                                            >
                                                {new Date(cred.createdAt).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <button
                                                    className='btn btn-ghost btn-sm btn-square text-base-content/40 hover:text-error'
                                                    onClick={() => openDelete(cred.id)}
                                                >
                                                    <Trash2 className='h-4 w-4' />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )
                    }
                </div>
            </div>
            <dialog className={`modal modal-middle ${addDialogOpen ? 'modal-open' : ''}`}>
                <div className='modal-box max-w-md rounded-2xl border border-white/10 bg-base-200'>
                    <h3 className='text-base font-semibold text-base-content'>
                        Add Credential
                    </h3>
                    <div className='mt-5 flex flex-col gap-4'>
                        <div>
                            <label
                                className='label'
                            >
                                <span className='label-text text-xs uppercase text-base-content/40'>
                                    Integration
                                </span>
                            </label>
                            <select
                                className='w-full text-sm py-2 mt-2 px-2'
                                value={selectedIntegrationId}
                                onChange={(e) => setSelectedIntegrationId(e.target.value)}
                            >
                                <option value="">
                                    Select integration
                                </option>
                                {integrations.map((i) => (
                                    <option key={i.id} value={i.id}>
                                        {i.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {selectedIntegration && authType === 'OAUTH2' && (
                            <ShimmerButton
                                className='w-full py-2 text-sm font-semibold'
                                onClick={handleOauthConnect}
                            >
                                {selectedIntegration.name} Login
                            </ShimmerButton>
                        )}
                        {selectedIntegration&&authType==='APIKEY'&&(
                            <form onSubmit={handleApikeySubmit} className="flex flex-col gap-4">
                                <div>
                                    <label className="label pb-2">
                                    <span className="label-text text-xs uppercase tracking-widest text-base-content/40">
                                        Label
                                    </span>
                                    </label>
                                    <input 
                                        className="input input-bordered w-full text-sm" 
                                        placeholder="My credential" 
                                        {...apikeyForm.register('label')} 
                                    />
                                    {apikeyForm.formState.errors.label && 
                                    <p className="mt-1 text-xs text-error">{apikeyForm.formState.errors.label.message}</p>}
                                </div>
                                <div>
                                    <label className="label pb-2">
                                        <span className="label-text text-xs uppercase tracking-widest text-base-content/40">
                                            API key
                                        </span>
                                    </label>
                                    <input 
                                        className="input input-bordered w-full text-sm" 
                                        type="password" 
                                        placeholder="API Key here" 
                                        {...apikeyForm.register('apiKey')} 
                                    />
                                    {apikeyForm.formState.errors.apiKey&& 
                                    <p className="mt-1 text-xs text-error">
                                        {apikeyForm.formState.errors.apiKey.message}
                                    </p>
                                    }
                                </div>
                                <div className="modal-action mt-2">
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddDialogOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                                        {saving ? <span className="loading loading-spinner loading-xs" /> : null}Save
                                    </button>
                                </div>
                            </form>
                        )}

                        {selectedIntegration&&authType==='TOKEN'&&(
                            <form onSubmit={handleTokenSubmit} className="flex flex-col gap-4">
                                <div>
                                    <label className="label pb-2">
                                        <span className="label-text text-xs uppercase tracking-widest text-base-content/40">
                                            Label
                                        </span>
                                    </label>
                                    <input className="input input-bordered w-full text-sm" placeholder="My credential" {...tokenForm.register('label')} />
                                    {tokenForm.formState.errors.label && <p className="mt-1 text-xs text-error">
                                        {tokenForm.formState.errors.label.message}
                                    </p>}
                                </div>
                                <div>
                                    <label className="label pb-2">
                                        <span className="label-text text-xs uppercase tracking-widest text-base-content/40">
                                            Bearer token
                                        </span>
                                    </label>
                                    <input 
                                    className="input input-bordered w-full text-sm" 
                                    type="password" 
                                    placeholder="Bearer Token here" 
                                    {...tokenForm.register('bearerToken')} 
                                    />
                                    {tokenForm.formState.errors.bearerToken && 
                                    <p className="mt-1 text-xs text-error">
                                        {tokenForm.formState.errors.bearerToken.message}
                                        </p>}
                                </div>
                                <div className="modal-action mt-2">
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddDialogOpen(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                                        {saving?<span className="loading loading-spinner loading-xs" />:null}Save
                                    </button>
                                </div>
                            </form>
                        )}
                        {!selectedIntegration && (
                            <div className="modal-action mt-2">
                                <button className="btn btn-ghost btn-sm" onClick={() => setAddDialogOpen(false)}>
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop" onClick={() => setAddDialogOpen(false)}>
                    <button>close</button>
                </form>
            </dialog>
            <dialog className={`modal modal-middle ${deleteDialogOpen ? 'modal-open' : ''}`}>
                <div className="modal-box max-w-sm rounded-2xl border border-white/10 bg-base-300">
                    <h3 className="text-base font-semibold text-base-content">Delete Credential</h3>
                    <div className="alert alert-error mt-4 text-sm">
                        Workflows using this credential will stop working.
                    </div>
                    <div className="modal-action mt-6">
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-error btn-sm" onClick={handleDelete} disabled={deleting}>
                            {deleting?<span className="loading loading-spinner loading-xs" />:null}Delete
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop" onClick={()=>setDeleteDialogOpen(false)}>
                    <button>
                        close
                    </button>
                </form>
            </dialog>
        </div>
    )
}