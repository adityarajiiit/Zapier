export interface SpreadsheetInfo{
    spreadsheetId:string
    title:string
    sheets:string[]
}
export interface RowData{
    values:any[][]
}

export interface AddRowInput{
    spreadsheetId:string
    sheetName:string
    values:any[]
}

export interface UpdateRowInput{
    spreadsheetId:string
    range:string
    values:any[]
}

export interface GetRowInput{
    spreadsheetId:string
    sheetName:string
    rowNumber:number
}

export interface SearchRowsInput{
    spreadsheetId:string
    sheetName:string
    columnIndex:number
    searchValue:string
}

export interface CreateSpreadsheetInput{
    title:string
}

export interface CreateSheetInput{
    spreadsheetId:string
    title:string
}