'use client'
import { Copy } from "lucide-react"

export function JsonViewer({data}:{data:any}){
    return(
        <div className="relative">
            <button
            className="absolute top-2 right-2 btn btn-ghost btn-xs btn-square"
            onClick={()=>navigator.clipboard.writeText(JSON.stringify(data,null,2))}
            >
            <Copy className="h-3 w-3"/>
            </button>
            <pre className="bg-base-100 border border-white/10 rounded-xl p-4 pr-8 text-xs font-mono text-base-content/60 overflow-x-auto max-h-48 overscroll-contain">
                {JSON.stringify(data,null,2)}
            </pre>
        </div>
    )
}