import { workflowController } from "../controllers/workflows.js";
import { FastifyInstance } from "fastify";

export default async function workflowRoutes(app:FastifyInstance){
    app.get('/',async(request,reply)=>workflowController.getAll(request,reply))
    app.get('/:id',async(request,reply)=>workflowController.getWorkflow(request,reply))
    app.post('/',async(request,reply)=>workflowController.newWorkflow(request,reply))
    app.put('/:id',async(request,reply)=>workflowController.updateWorkflow(request,reply))
    app.delete('/:id',async(request,reply)=>workflowController.deleteWorkflow(request,reply))
    app.post('/:id/activate',async(request,reply)=>workflowController.activateWorkflow(request,reply))
    app.post('/:id/deactivate',async(request,reply)=>workflowController.deactivateWorkflow(request,reply))
    app.post('/:id/trigger',async(request,reply)=>workflowController.triggerWorkflow(request,reply))
    app.put('/:id/steps/reorder',async(request,reply)=>workflowController.reorderSteps(request,reply))
    app.post('/:id/steps',async(request,reply)=>workflowController.addStep(request,reply))
    app.put('/:id/steps/:stepId',async(request,reply)=>workflowController.updateStep(request,reply))
    app.delete('/:id/steps/:stepId',async(request,reply)=>workflowController.deleteStep(request,reply))
    app.put('/:id/sync',async(request,reply)=>workflowController.syncWorkflow(request,reply))
    app.post('/:id/webhook/regenerate',async(request,reply)=>workflowController.regenerateWebhook(request,reply))
    app.get('/:id/webhook/list',async(request,reply)=>workflowController.getWebhook(request,reply))
}