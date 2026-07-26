import {credentialController} from "../controllers/credentials.js"
import fastify, { FastifyInstance } from "fastify"
export const credentialRoutes=async(fastify:FastifyInstance)=>{
    fastify.get("/",(request,reply)=>credentialController.getAll(request,reply))
    fastify.post("/",(request,reply)=>credentialController.create(request,reply))
    fastify.delete("/:id",(request,reply)=>credentialController.delete(request,reply))
    fastify.get("/:id/test",(request,reply)=>credentialController.test(request,reply))
}