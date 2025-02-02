import ObsidianWolframJsPlugin from "../main";
import WolframJSItemView, {WOLFRAMJS_ITEM_VIEW_TYPE} from "./WolframJSItemView";
import {FileSystemAdapter, TFile, View} from "obsidian";
import {ControlMessage} from "./Action";

export const createNewNotebook = async (plugin:ObsidianWolframJsPlugin)=>{
	const newLeaf = plugin.app.workspace.getLeaf(true)
	let wolframItemView = new WolframJSItemView(newLeaf, plugin)
	await wolframItemView.setState({
		serverAddress: plugin.settings.root_address,
		path: `/iframe/${(plugin.app.vault.adapter as FileSystemAdapter).getBasePath()}`,
		typeOfPath: "raw"
	}, {
		history: true
	})
	await newLeaf.open(wolframItemView as unknown as View)
	let iframe = wolframItemView.iframe
	const message:ControlMessage = {
		'type': 'controls',
		'name': 'newnotebook',
		'data':'true'
	}
	if (iframe){
		console.log("Iframe exist")
		iframe.contentWindow?.postMessage(message, "*")
	}

}

export const switchToSetting = async (plugin: ObsidianWolframJsPlugin) => {
    const newLeaf = plugin.app.workspace.getLeaf(true)
    let wolframItemView = new WolframJSItemView(newLeaf, plugin)
    await wolframItemView.setState({
        serverAddress: plugin.settings.root_address,
        path: "/settings",
        typeOfPath: "raw"
    }, {
        history: true
    })
    await newLeaf.open(wolframItemView as unknown as View)
    await newLeaf.setViewState({
		type: WOLFRAMJS_ITEM_VIEW_TYPE,
		state: {
			serverAddress: plugin.settings.root_address,
			path: "/settings",
			typeOfPath: "raw"
		}
	})
}

export async function switchToWolframView(file: TFile | null, serverAddress: string) {
    const newLeaf = this.app.workspace.getLeaf(false)

    if (file instanceof TFile) {
        let wolframItemView = new WolframJSItemView(newLeaf, this.plugin)
        await wolframItemView.setState({
            serverAddress: serverAddress,
            path: file.path,
            typeOfPath: "file"
        }, {
            history: true
        })

        await newLeaf.open(wolframItemView as unknown as View)
        await newLeaf.setViewState({
            type: WOLFRAMJS_ITEM_VIEW_TYPE,
            active: true,
            state: {
                originalFilePath: file.path,
                serverAddress: serverAddress
            }
        })

    }


}
