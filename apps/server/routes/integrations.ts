import {integrationController} from "../controllers/integrations.js"
import {FastifyInstance} from "fastify"

export default async function integrationRoutes(app:FastifyInstance){
    app.get('/',async(request,reply)=>integrationController.getAll(request,reply))
    app.get('/:id',async(request,reply)=>integrationController.getIntegration(request,reply))
}