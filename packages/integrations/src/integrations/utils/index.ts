import { Integration } from "../../types.js";
import{
    delayAction,
    httpRequestAction,
    filterAction,
    logAction,
    transformDataAction
} from './actions.js'

export const integrationUtils:Integration={
    id:'utils',
    name:'Internal Utils',
    description:'Basic utilities for workflows',
    authType:'NONE',
    triggers:{},
    actions:{
        'delay':delayAction,
        'http-request':httpRequestAction,
        'filter':filterAction,
        'log':logAction,
        'transform-data':transformDataAction
    }
}