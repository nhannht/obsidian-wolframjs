import {App, FileSystemAdapter, IconName, ItemView, Menu, TFile, WorkspaceLeaf} from "obsidian";
import ObsidianWolframJsPlugin from "../main";
import {WOLFRAMJS_ICON_ID} from "./icon";
import * as path from "path";
import * as ct from "electron";
import {Abort, ChooseKernel, ClearOutputs, DeleteFocusedCell, Save, SaveAs, ToggleFocusedCell} from "./Action";


export const WOLFRAMJS_ITEM_VIEW_TYPE = "wolframjs-item-view"
export type WolframjsItemViewConfig = {
	serverAddress: string,
	originalFilePath: string | null
}
export default class WolframJSItemView extends ItemView {
	iframe: HTMLIFrameElement | null
	config: WolframjsItemViewConfig
	actionButtons: Record<string,HTMLElement>

	constructor(leaf: WorkspaceLeaf,
				public plugin: ObsidianWolframJsPlugin,
	) {
		super(leaf)
		this.actionButtons = {}

	}

	getDisplayText(): string {
		return `View ${this.config.originalFilePath} as WolframJS`
	}

	getViewType(): string {
		return WOLFRAMJS_ITEM_VIEW_TYPE;
	}

	getIcon(): IconName {
		return WOLFRAMJS_ICON_ID;
	}

	// onPaneMenu(menu: Menu, source: "more-options" | "tab-header" | string) {
	// 	if (source !== 'more-options') {
	// 		super.onPaneMenu(menu, source);
	// 		return;
	// 	}
	// 	menu.addItem((item) => {
	// 		item.setTitle("Go back to original markdown file (remember to save the change you made)")
	// 			.setIcon(WOLFRAMJS_ICON_ID)
	// 			.setSection("pane")
	// 			.onClick(async () => {
	// 				await this.switchToNormalMode();
	// 			})
	// 	})
	// }


	loadIframe(container: Element) {
		this.iframe = container.createEl('iframe');
		this.iframe.setAttribute('sandbox', 'allow-forms allow-presentation allow-same-origin allow-scripts')
		const vault_path = (this.app.vault.adapter as FileSystemAdapter).getBasePath()
		// console.log(vault_path)
		const file = this.config.originalFilePath ? this.config.originalFilePath : ""
		const fileAbsPath = path.resolve(vault_path, file)
		const url = new URL(path.join("/iframe/", fileAbsPath), this.plugin.settings.root_address)
		this.iframe.src = url.toString()
		// this.iframe.win.addEventListener('message', this.eventListener)
	}

	// eventListener = async (event: MessageEvent) => {
	// 	if (event.data.type === 'request') {
	// 		const result = await ct.remote.dialog.showSaveDialog({})
	// 		const uuid = event.data.promise
	//
	// 		if (result.filePath) {
	// 			const fileExt = result.filePath.split(".").pop()
	// 			let filePath = result.filePath
	// 			if (fileExt && fileExt === "wln") {
	// 				filePath = result.filePath.slice(0, -(fileExt.length + 1))
	//
	// 			}
	// 			const message = {
	// 				'type': 'promise',
	// 				'promise': uuid,
	// 				'data': encodeURIComponent(filePath)
	// 			}
	// 			// console.log(message)
	// 			this.iframe?.contentWindow?.postMessage(message, "*")
	// 		}
	// 	}
	// }


	private async switchToNormalMode() {
		if (this.config.originalFilePath != null) {
			const file = this.app.vault.getFileByPath(this.config.originalFilePath)
			const wolframCurrentLeaf = this.app.workspace.getActiveViewOfType(WolframJSItemView)

			if (file instanceof TFile) {
				const leaf = this.app.workspace.getLeaf(false)
				await leaf.openFile(file)
			}
		}

	}


	async onOpen() {
		const container = this.containerEl.children[1];
		// console.log(this.file)
		try {
			this.loadIframe(container)

		} catch (e) {
			console.error(e);
			const error = container.createDiv({text: e.toString()})
		}

		await this.registerActionButtons()


	}

	async registerActionButtons() {
		if (this.config.originalFilePath != null) {
			const originalFile = this.app.vault.getFileByPath(this.config.originalFilePath)
			if (originalFile instanceof TFile) {
				const ext = originalFile.extension
				// console.log(ext)
				// markdown  and nb file can eval but cannot save directly, save via saveas
				// wl can save directly, can edit but impossible to eval
				// wln can do anything
				// thing can eval can [pick/abort kernel, hide/show/delete result cell]

				if (ext !== "wl") {
					this.actionButtons["Abort"] =  this.addAction("circle-stop", "Abort", () => Abort(this.iframe))
					this.actionButtons["Clear output"] =  this.addAction("list-x", "Clear output", () => ClearOutputs(this.iframe))
					this.actionButtons["Toggle focus cell"] = this.addAction("toggle-left", "Toggle focus cell", () => ToggleFocusedCell(this.iframe))
					this.actionButtons["Delete focus cell"] = this.addAction("eraser", "Delete focus cell", () => DeleteFocusedCell(this.iframe))
					this.actionButtons["Pick kernel"] = this.addAction("cpu", "Pick kernel", () => ChooseKernel(this.iframe))

				}
				if (ext !== "md" && ext !== 'nb') {
					this.actionButtons["Save"] =  this.addAction("save", "Save", () => Save(this.iframe))

				}
				this.actionButtons["Save as"] = this.addAction("save-all", "Save as Wln file", () => SaveAs(this.iframe))
				this.actionButtons["Go back to origin"] =  this.addAction("arrow-left",
					"Go back to the original markdown file - remember to save the changed",
					() => this.switchToNormalMode())
			}
		}

	}


	async onClose() {
		// await super.onClose()
		Object.entries(this.actionButtons).forEach(([k,v])=>{
			v.remove()


		})
		this.actionButtons = {}


	}

}
