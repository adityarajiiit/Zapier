import { oauthController } from "../controllers/oauth";
import fastify, { FastifyInstance } from "fastify"
export const oauthRoutes=async(fastify:FastifyInstance)=>{
    fastify.get("/connect/:integrationId",(request,reply)=>oauthController.connect(request,reply))
    fastify.get("/callback",(request,reply)=>oauthController.callback(request,reply))
}