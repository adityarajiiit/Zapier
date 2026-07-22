import{prisma} from "@repo/prisma"
import * as os from "os"
import {startPollingLoop} from "./utils/loop.js"
const workerId=`${os.hostname()}-${process.pid}`
console.log(`${workerId} started`)
const interval=startPollingLoop(workerId)
async function shutdown() {
    console.log(`${workerId} shutting down`)
    clearInterval(interval)
    await prisma.$disconnect()
    process.exit(0)
}
process.on("SIGINT",shutdown)
process.on("SIGTERM",shutdown)
