"use client"
import { AnimatePresence, motion } from "motion/react"
import { usePathname } from "next/navigation"

export function PageTransition({children}:{children:React.ReactNode}){
  const pathname=usePathname()

  return(
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{opacity:0,y:16}}
        animate={{opacity:1,y:0}}
        exit={{opacity:0,y:-8}}
        transition={{duration:0.22,ease:"easeOut"}}
        className="flex-1"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
