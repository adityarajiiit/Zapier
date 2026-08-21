'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {Search} from 'lucide-react'
import {RiGeminiFill,RiNotionFill} from 'react-icons/ri'
import {FaSlack,FaGithub} from 'react-icons/fa'
import {SiGooglesheets,SiGmail} from 'react-icons/si'

import {BackgroundBeams} from '@/components/ui/background-beams'
import {TextGenerateEffect} from '@/components/ui/text-generate-effect'
import {BentoGrid,BentoGridItem} from '@/components/ui/bento-grid'

import {useGetIntegrationsQuery, useGetCredentialsQuery} from '../store/api'
import type {Integration} from '../store/api'

import {Settings, Beaker} from 'lucide-react'

const icons:Record<string,React.ReactNode>={
  gmail:<SiGmail className="h-6 w-6"/>,
  github:<FaGithub className="h-6 w-6"/>,
  slack:<FaSlack className="h-6 w-6"/>,
  gemini:<RiGeminiFill className="h-6 w-6"/>,
  'google-sheets':<SiGooglesheets className="h-6 w-6"/>,
  notion:<RiNotionFill className="h-6 w-6"/>,
  utils:<Settings className="h-6 w-6"/>,
  test:<Beaker className="h-6 w-6"/>,
}

function getIcon(id:string){
  return icons[id.toLowerCase()]||null
}

function IntegrationHeader({integration, isConnected}:{integration:Integration, isConnected?: boolean}){
  const triggerCount=integration.triggers?.length||0
  const actionCount=integration.actions?.length||0
  return(
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-base-300 text-base-content/70">
          {getIcon(integration.id)}
        </div>
        <span className={`badge badge-sm ${isConnected ? 'badge-success' : 'badge-ghost'}`}>
          {isConnected ? 'Connected' : 'Not connected'}
        </span>
      </div>
      <p className="text-xs text-base-content/35">
        {triggerCount} trigger{triggerCount!==1?'s':''} · {actionCount} action{actionCount!==1?'s':''}
      </p>
    </div>
  )
}

export default function IntegrationsPage(){
  const router=useRouter()
  const{data:integrations=[]}=useGetIntegrationsQuery()
  const{data:credentials=[]}=useGetCredentialsQuery()
  const[query,setQuery]=useState('')

  const filtered=integrations.filter((i)=>
    i.name.toLowerCase().includes(query.toLowerCase())
  )

  return(
    <div className="relative min-h-screen w-full bg-base-100">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <BackgroundBeams className="opacity-20"/>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8">
          <TextGenerateEffect words="Integrations" className="text-3xl font-bold tracking-tight text-base-content lg:text-4xl"/>
          <p className="mt-2 text-sm text-base-content/50">
            Connect your apps and automate your workflows
          </p>
          <div className="relative mt-6 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/35"/>
            <input
              className="w-full py-2.5 pl-9 pr-4 text-sm"
              placeholder="Search integrations..."
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
            />
          </div>
        </div>

        {filtered.length===0?(
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <Search className="h-6 w-6 text-base-content/25"/>
            <p className="text-sm text-base-content/40">No integrations found</p>
          </div>
        ):(
          <BentoGrid>
            {filtered.map((integration,i)=>(
              <BentoGridItem
                key={integration.id}
                className={`cursor-pointer rounded-xl border border-white/2 bg-base-200 hover:border-white/10 hover:bg-base-300 transition-colors duration-200`}
                header={<IntegrationHeader integration={integration} isConnected={credentials.some((c: any) => c.integrationId === integration.id)} />}
                title={integration.name}
                description={
                  <span className="line-clamp-2 text-base-content/40">
                    {integration.description??'No description provided.'}
                  </span>
                }
                icon={
                  <div className="mb-2 text-base-content/40">
                    {getIcon(integration.id)}
                  </div>
                }
                onClick={()=>router.push(`/dashboard/integrations/${integration.id}`)}
              />
            ))}
          </BentoGrid>
        )}
      </div>
    </div>
  )
}