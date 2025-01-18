import {App, FileSystemAdapter, IconName, ItemView, Menu, TFile, WorkspaceLeaf} from "obsidian";
import ObsidianWolframJsPlugin from "../main";
import {WOLFRAMJS_ICON_ID} from "./icon";
import * as path from "path";
import * as ct from "electron";


export const WOLFRAMJS_ITEM_VIEW_TYPE = "wolframjs-item-view"
export type WolframjsItemViewConfig = {
	serverAddress: string,
	originalFilePath: string
}
export default class WolframJSItemView extends ItemView {
	iframe: HTMLIFrameElement | null
	config: WolframjsItemViewConfig

	constructor(leaf: WorkspaceLeaf,
				public plugin: ObsidianWolframJsPlugin,
	) {
		super(leaf)

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

	onPaneMenu(menu: Menu, source: "more-options" | "tab-header" | string) {
		if (source !== 'more-options') {
			super.onPaneMenu(menu, source);
			return;
		}
		menu.addItem((item) => {
			item.setTitle("Go back to original markdown file (remember to save the change you made)")
				.setIcon(WOLFRAMJS_ICON_ID)
				.setSection("pane")
				.onClick(async () => {
					await this.switchToNormalMode();
				})
		})
	}


	loadIframe(container: Element) {
		this.iframe = container.createEl('iframe');
		this.iframe.setAttribute('sandbox', 'allow-forms allow-presentation allow-same-origin allow-scripts')
		const vault_path = (this.app.vault.adapter as FileSystemAdapter).getBasePath()
		// console.log(vault_path)
		const file = this.config.originalFilePath
		const fileAbsPath = path.resolve(vault_path, file)
		const url = new URL(path.join("/iframe/", fileAbsPath), this.plugin.settings.root_address)
		this.iframe.src = url.toString()
		this.iframe.win.addEventListener('message', this.eventListener)
	}

	eventListener = async (event: MessageEvent) => {
		if (event.data.type === 'request') {
			const result = await ct.remote.dialog.showSaveDialog({})
			const uuid = event.data.promise

			if (result.filePath) {
				const fileExt = result.filePath.split(".").pop()
				let filePath = result.filePath
				if (fileExt && fileExt === "wln"){
					filePath= result.filePath.slice(0, -(fileExt.length+1))

				}
				const message = {
					'type': 'promise',
					'promise': uuid,
					'data': encodeURIComponent(filePath)
				}
				// console.log(message)
				this.iframe?.contentWindow?.postMessage(message, "*")
			}
		}
	}


	private async switchToNormalMode() {
		const file = this.app.vault.getFileByPath(this.config.originalFilePath)
		const wolframCurrentLeaf = this.app.workspace.getActiveViewOfType(WolframJSItemView)
		if (wolframCurrentLeaf instanceof WolframJSItemView) {

		}

		if (file instanceof TFile) {
			const leaf = this.app.workspace.getLeaf(false)
			await leaf.openFile(file,{active:false})
			this.app.workspace.detachLeavesOfType(WOLFRAMJS_ITEM_VIEW_TYPE)

		}


	}

	async onOpen() {
		const container = this.containerEl.children[1];
		// console.log(this.file)
		try {
			setTimeout(() => this.loadIframe(container), 100)

		} catch (e) {
			console.error(e);
			const error = container.createDiv({text: e.toString()})

		}

		this.addAction(WOLFRAMJS_ICON_ID, "Switch back to text mode", () => {
			this.switchToNormalMode()
		})

	}
	async onClose() {
		// await super.onClose()
		if (this.iframe){
			this.iframe.win.removeEventListener("message",this.eventListener)
		}

	}

}
