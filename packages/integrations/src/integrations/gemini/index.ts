import{Integration} from '../../types.js'
import{
    generateTextAction,
    summarizeAction,
    categorizeAction,
    extractDataAction,
    transformTextAction
} from './actions.js'

export const integrationGemini:Integration={
    id:'gemini',
    name:'Gemini',
    description:'It is an LLM',
    icon:'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
    authType:'APIKEY',
    triggers:{},
    actions:{
        'generate-text':generateTextAction,
        'summarize':summarizeAction,
        'categorize':categorizeAction,
        'extract-data':extractDataAction,
        'transform-text':transformTextAction
    }
}