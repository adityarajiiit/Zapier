import{createSlice,PayloadAction} from "@reduxjs/toolkit"

export interface ConfirmModel{
    isOpen:boolean
    title:string
    message:string
    onConfirmAction:{
        type:string
        payload?:any
    }
}

export interface UIState{
    sidebarCollapsed:boolean
    confirmModel:ConfirmModel|null
}

const initialState:UIState={
    sidebarCollapsed:false,
    confirmModel:null
}

const uiSlice=createSlice({
    name:'ui',
    initialState,
    reducers:{
        toggleSidebar(state){
            state.sidebarCollapsed=!state.sidebarCollapsed
        },
        setSidebarCollapsed(state,action:PayloadAction<boolean>){
            state.sidebarCollapsed=action.payload
        },
        openConfirmModel(state,action:PayloadAction<Omit<ConfirmModel,"isOpen">>){
            state.confirmModel={
                ...action.payload,
                isOpen:true
            }
        },
        closeConfirmModel(state){
            if(state.confirmModel){
                state.confirmModel.isOpen=false
            }
        },
        clearConfirmModel(state){
            state.confirmModel=null
        }
    }
})

export const{
    toggleSidebar,
    setSidebarCollapsed,
    openConfirmModel,
    clearConfirmModel,
    closeConfirmModel
}=uiSlice.actions

export default uiSlice.reducer