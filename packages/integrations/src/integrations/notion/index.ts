import{Integration} from '../../types.js'
import{
    createPageAction,
    updatePageAction,
    addToDatabaseAction,
    searchAction,
    createDatabaseAction,
    appendBlockAction
} from './actions.js'

import{
    newDatabaseItemTrigger,
    updatedPageTrigger
} from './triggers.js'

export const notionIntegration:Integration={
    id:'notion',
    name:'Notion',
    description:'Integrate with Notion to create and update pages, databases, and more.',
    icon:'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png',
    authType:'OAUTH2',
    triggers:{
        'new-database-item':newDatabaseItemTrigger,
        'updated-page':updatedPageTrigger,
    },
    actions:{
        'create-page':createPageAction,
        'update-page':updatePageAction,
        'add-to-database':addToDatabaseAction,
        'search':searchAction,
        'create-database':createDatabaseAction,
        'append-block':appendBlockAction
    }
}