import { ExecutionContext,resolvePath } from "./template.js";
export type Operator='equals'|'not-equal'|'contains'|'not-contains'|'greater-than'|'less-than'|'is-empty'|'is-not-empty'

export interface Condition{
    field:string
    operator:Operator
    value?:any
}

export interface ConditionConfig{
    type:'if'
    conditions:Condition[]
    logic:'AND'|'OR'
    thenNextStepOrder?:number
    elseNextStepOrder?:number
}

export const evaluate=(c:Condition,ct:ExecutionContext):boolean=>{
    const field=resolvePath(c.field,ct)
    const value=c.value
    const operator=c.operator||'equals'
    switch(operator){
        case'equals':
           return field==value
        case'not-equal':
           return field!=value
        case'contains':
           return String(field||'').includes(String(value||''))
        case'not-contains':
           return !String(field||'').includes(String(value||''))
        case'greater-than':
           return Number(field)>Number(value)
        case'less-than':
           return Number(field)<Number(value)
        case'is-empty':
           return field==null||field===''
        case'is-not-empty':
           return field!=null&&field!==''
        default:
           return false
    }
}

export const evaluateCondition=(config:any,ct:ExecutionContext):boolean=>{
    if(Array.isArray(config.conditions)){
        if(config.logic==='AND'){
            return config.conditions.every((c:Condition)=>evaluate(c,ct))
        }
        else{
            return config.conditions.some((c:Condition)=>evaluate(c,ct))
        }
    }
    return evaluate(config as Condition,ct)
}

export const evaluateFilter=evaluateCondition