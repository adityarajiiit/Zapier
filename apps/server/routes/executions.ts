import { executionController } from "../controllers/executions.js";
import { FastifyInstance } from "fastify";

export default async function executionRoutes(app:FastifyInstance){
    app.get('/',async(request,reply)=>executionController.getAll(request,reply))
    app.get('/:id',async(request,reply)=>executionController.getExecution(request,reply))
}