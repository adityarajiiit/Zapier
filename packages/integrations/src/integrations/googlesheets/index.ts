import { Integration } from "../../types.js";
import{
    addRowAction,
    updateRowAction,
    getRowAction,
    searchRowsAction,
    createSpreadsheetAction,
    createSheetAction
} from'./actions.js'

import{
    newRowTrigger,
    updatedRowTrigger
} from './triggers.js'

export const integrationGoogleSheets:Integration={
    id:'google-sheets',
    name:'Google Sheets',
    description:'Integration with Google Sheets',
    authType:'OAUTH2',
    icon:'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/google-sheets.svg',
    triggers:{
        'new-row':newRowTrigger,
        'updated-row':updatedRowTrigger
    },
    actions:{
        'add-row':addRowAction,
        'update-row':updateRowAction,
        'get-row':getRowAction,
        'search-rows':searchRowsAction,
        'create-spreadsheet':createSpreadsheetAction,
        'create-sheet':createSheetAction
    }
}