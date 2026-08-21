"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession,signOut } from "next-auth/react"
import{motion} from"motion/react"
import{Sidebar,SidebarBody,useSidebar} from "@/components/ui/sidebar"
import{
    LayoutDashboard,
    Zap,
    Puzzle,
    KeyRound,
    Activity,
    Settings,
    LogOut,
    Infinity
} from "lucide-react"
import{cn} from "@/lib/utils"

const items=[
    {
        label:"Dashboard",
        href:"/dashboard",
        icon:LayoutDashboard,
        exact:true
    },
    {
        label:"Workflows",
        href:"/dashboard/workflows",
        icon:Zap,
        exact:false
    },
    {
        label:"Integrations",
        href:"/dashboard/integrations",
        icon:Puzzle,
        exact:false
    },
    {
        label:"Credentials",
        href:"/dashboard/credentials",
        icon:KeyRound,
        exact:false
    },
    {
        label:"Executions",
        href:"/dashboard/executions",
        icon:Activity,
        exact:false
    },
    {
        label:"Settings",
        href:"/dashboard/settings",
        icon:Settings,
        exact:false
    }
]

function Nav({
    href,
    icon:Icon,
    label,
    exact
}:{
    href:string
    icon:React.ElementType
    label:string
    exact:boolean
}){
    const{open,animate}=useSidebar()
    const pathname=usePathname()
    const active=exact?pathname===href:pathname.startsWith(href)
    return(
        <Link
        href={href}
        className={
            cn(
                "relative flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors duration-150 group",
                active?"bg-base-300 text-base-content":"text-base-content/60 hover:bg-base-300 hover:text-base-content"
            )
        }
        >
            {active&&(
                <span className="absolute left-0 w-[2px] h-5 bg-base-content rounded-r-full" />
            )}
            <Icon size={20} className="shrink-0"/>
            <motion.span
            animate={{
                display:animate?(open?"inline-block":"none"):"inline-block",
                opacity:animate?(open?1:0):1,
            }}
            className="text-sm font-medium whitespace-pre !p-0 !m-0"
            >
            {label}
            </motion.span>
        </Link>
    )
}

function SidebarContent(){
    const {open,animate}=useSidebar()
    const {data:session}=useSession()
    return(
        <div className="flex flex-col justify-between h-full">
            <div className="flex flex-col gap-1 overflow-x-hidden overflow-y-auto">
                 <div className="flex items-center gap-2 px-2 py-1 mb-6">
                    <Infinity size={22} className="text-base-content shrink-0"/>
                    <motion.span
                    animate={{
                        display:animate?(open?"inline-block":"none"):"inline-block",
                        opacity:animate?(open?1:0):1,
                    }}
                    className="text-base-content font-bold text-base whitespace-pre"
                    >
                        Zapier
                    </motion.span>
                 </div>

                <div className="relative flex flex-col gap-0.5">
                    {items.map((item)=>(
                        <Nav key={item.href} {...item} />
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-1 overflow-x-hidden">
                <div className="flex items-center gap-3 px-2 py-2.5">
                    <div className="avatar shrink-0">
                        <div className="w-7 h-7 rounded-full overflow-hidden">
                            <img
                            src={
                                session?.user?.image||
                                `https://github.com/shadcn.png`
                            }
                            alt={session?.user?.name ?? "User"}
                            />
                        </div>
                    </div>
                    <motion.div
                    animate={{
                        display:animate?(open?"flex":"none"):"flex",
                        opacity:animate?(open?1:0):1,
                    }}
                    className="flex flex-col min-w-0"
                    >
                        <span className="text-base-content text-sm font-medium truncate leading-tight">
                            {session?.user?.name||"User"}
                        </span>
                        <span className="text-base-content/60 text-xs truncate leading-tight">
                            {session?.user?.email||""}
                        </span>
                    </motion.div>
                </div>

                <button
                onClick={()=>signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-base-content/60 hover:bg-base-300 hover:text-base-content transition-colors duration-150 w-full"
                >
                    <LogOut size={20} className="shrink-0" />
                    <motion.span
                    animate={{
                        display:animate?(open?"inline-block":"none"):"inline-block",
                        opacity:animate?(open?1:0):1,
                    }}
                    className="text-sm font-medium whitespace-pre !p-0 !m-0"
                    >
                        Sign out
                    </motion.span>
                </button>
            </div>
        </div>
    )
}

export function AppSidebar(){
    const [open,setOpen]=useState(false)

    return(
        <Sidebar open={open} setOpen={setOpen} animate={true}>
            <SidebarBody className="h-screen bg-base-100 border-r border-base-content/10 px-3 py-4">
                <SidebarContent />
            </SidebarBody>
        </Sidebar>
    )
}