import * as ct from "electron"
import {TAbstractFile, TFile, View} from "obsidian";
import WolframJSItemView, {WOLFRAMJS_ITEM_VIEW_TYPE} from "./WolframJSItemView";

export type ControlMessage = {
	type: string,
    name: string,
    data: string
}

export async function switchToWolframView(file:TFile|null, serverAddress: string) {
	const newLeaf = this.app.workspace.getLeaf(false)

	if (file instanceof TFile) {
		let wolframItemView = new WolframJSItemView(newLeaf, this.plugin)
		await wolframItemView.setState({
			serverAddress: serverAddress,
			originalFilePath: file.path
		},{
			history:true
		})

		await newLeaf.open(wolframItemView as unknown as View)
		await newLeaf.setViewState({
			type: WOLFRAMJS_ITEM_VIEW_TYPE,
			active:true,
			state:{
				originalFilePath: file.path,
				serverAddress: serverAddress
			}
		})

	}



}

export const SaveAs = async (iframe:HTMLIFrameElement|null) => {
	const result = await ct.remote.dialog.showSaveDialog({
		title: "Pick a wln file where you want to save",
		properties: [
			// "showHiddenFiles",
			"createDirectory"
		],
		filters: [
			{
				name: "Wolframjs Notebookfile",
				extensions: ["wln"]
			}
		]
	})

	if (result.filePath) {
		const fileExt = result.filePath.split(".").pop()
		let filePath = result.filePath
		if (fileExt && fileExt !== "wln") {
			filePath = result.filePath + ".wln"
		}
		const message:ControlMessage = {
			'type': 'controls',
			'name': 'saveas',
			'data': encodeURIComponent(filePath)
		}
		iframe?.contentWindow?.postMessage(message, "*")
	}

}

export const Abort = async (iframe: HTMLIFrameElement|null) => {
	const message:ControlMessage = {
		'type': 'controls',
		'name': 'abort',
		'data':'true'

	}
	if (iframe){
		iframe.contentWindow?.postMessage(message, "*")

	}
}

export const ChooseKernel = async (iframe: HTMLIFrameElement|null) => {
	const message:ControlMessage = {
		"type":"controls",
		"name": "changekernel",
		"data":"true"
	}
	if (iframe){
		iframe.contentWindow?.postMessage(message,"*")
	}
}

export const Save = async (iframe: HTMLIFrameElement|null) => {
	const message:ControlMessage = {
		type:"controls",
		name:"save",
		data:"true"
	}
	if (iframe){
		iframe.contentWindow?.postMessage(message,"*")
	}
}
export const ReopenAsQuick = async (iframe:HTMLIFrameElement|null)=>{
	const message:ControlMessage = {
		type:'controls',
		name:"reopenasquick",
		data:"true"
	}
	if (iframe){
        iframe.contentWindow?.postMessage(message,"*")
    }
}
export const UnHideAllCells = async (iframe:HTMLIFrameElement|null)=>{
	const message:ControlMessage = {
		type:'controls',
		name:'unhideallcells',
		data:"True"

	}
	if (iframe){
		iframe.contentWindow?.postMessage(message,"*")
	}
}

export const ClearOutputs = async (iframe: HTMLIFrameElement|null)=>{
	const message:ControlMessage = {
		type:"controls",
		name:'clearoutputs',
		data:'True'
	}
	if (iframe){
		iframe.contentWindow?.postMessage(message,"*")
	}
}

export const ToggleFocusedCell = async (iframe:HTMLIFrameElement|null)=>{
	const message: ControlMessage = {
		type:'controls',
		name:'togglecell',
		data:"True"
	}
	if (iframe){
		iframe.contentWindow?.postMessage(message,'*')
	}

}
export const DeleteFocusedCell = async (iframe: HTMLIFrameElement|null)=>{
	const message:ControlMessage = {
		type:'controls',
		name:'deletecell',
		data:"True"
	}
	if (iframe){
		iframe.contentWindow?.postMessage(message,'*')
	}
}


