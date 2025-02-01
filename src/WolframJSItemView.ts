import {FileSystemAdapter, IconName, ItemView, TFile, ViewStateResult, WorkspaceLeaf} from "obsidian";
import ObsidianWolframJsPlugin, {delay} from "../main";
import {WOLFRAMJS_ICON_ID} from "./icon";
import * as path from "path";
import {Abort, ChooseKernel, ClearOutputs, DeleteFocusedCell, Save, SaveAs, ToggleFocusedCell} from "./Action";


export const WOLFRAMJS_ITEM_VIEW_TYPE = "wolframjs-item-view"

export interface WolframjsItemViewPersistentState extends Record<string, unknown> {
	serverAddress: string,
	originalFilePath: string
}

export default class WolframJSItemView extends ItemView implements WolframjsItemViewPersistentState {
	iframe: HTMLIFrameElement | null
	actionButtons: Record<string, HTMLElement>
	serverAddress: string
	originalFilePath: string


	constructor(leaf: WorkspaceLeaf,
				public plugin: ObsidianWolframJsPlugin,
	) {
		console.log("constructor call")
		super(leaf)
		this.actionButtons = {}


	}

	[key: string]: unknown;


	getState = (): WolframjsItemViewPersistentState => {

		console.log("Get state trigger")
		// console.log(this.leaf.getViewState())
		return {

			serverAddress: this.serverAddress,
			originalFilePath: this.originalFilePath

		}
	};



	async setState(state: WolframjsItemViewPersistentState, result: ViewStateResult): Promise<void> {


		this.serverAddress = state["serverAddress"]

		this.originalFilePath = state["originalFilePath"]


		const container = this.containerEl.children[1];
		// console.log(this.file)
		try {
			this.loadIframe(container)

		} catch (e) {
			console.error(e);
			const error = container.createDiv({text: e.toString()})
		}

		// await this.registerActionButtons()

		if (Object.keys(this.actionButtons).length === 0) {
			await this.registerActionButtons()
		}

		return super.setState(state, result);
	}


	getDisplayText() {
		console.log("Get display text trigger")
		if (!this.originalFilePath) {
			return "WolframJS"
		} else {
			return `${this.originalFilePath}`

		}
	}

	getViewType(): string {
		console.log("Get view type trigger")
		return WOLFRAMJS_ITEM_VIEW_TYPE;
	}

	getIcon(): IconName {
		console.log("Get icon trigger")
		return WOLFRAMJS_ICON_ID;
	}


	loadIframe(container: Element) {
		console.log("Load iframe trigger")
		this.iframe = container.createEl('iframe');
		this.iframe.setAttribute('sandbox', 'allow-forms allow-presentation allow-same-origin allow-scripts')
		const vault_path = (this.app.vault.adapter as FileSystemAdapter).getBasePath()
		// console.log(vault_path)
		const file = this.originalFilePath ? this.originalFilePath : ""
		console.log(file)
		const fileAbsPath = path.resolve(vault_path, file)
		// console.log(fileAbsPath)
		const url = new URL(path.join("/iframe/", fileAbsPath), this.serverAddress)
		this.iframe.src = url.toString()
		console.log(this.iframe.src)
		// this.iframe.win.addEventListener('message', this.eventListener)
	}


	private async switchToNormalMode() {

		if (this.originalFilePath != null) {
			const file = this.app.vault.getFileByPath(this.originalFilePath)

			if (file instanceof TFile) {
				const leaf = this.app.workspace.getLeaf(false)
				await leaf.openFile(file)
			}
			const currentLeaf = this.leaf
			this.leaf.detach()
		}

	}


	async onOpen() {
		await super.onOpen()

		console.log("onOpen trigger")
		// console.log(this.leaf.getViewState())
		// this.app.workspace.requestSaveLayout()


	}

	async registerActionButtons() {

		if (this.originalFilePath != null) {
			const originalFile = this.app.vault.getFileByPath(this.originalFilePath)
			if (originalFile instanceof TFile) {
				const ext = originalFile.extension
				// console.log(ext)
				// markdown  and nb file can eval but cannot save directly, save via saveas
				// wl can save directly, can edit but impossible to eval
				// wln can do anything
				// thing can eval can [pick/abort kernel, hide/show/delete result cell]

				if (ext !== "wl") {
					this.actionButtons["Abort"] = this.addAction("circle-stop", "Abort", () => Abort(this.iframe))
					this.actionButtons["Clear output"] = this.addAction("list-x", "Clear output", () => ClearOutputs(this.iframe))
					this.actionButtons["Toggle focus cell"] = this.addAction("toggle-left", "Toggle focus cell", () => ToggleFocusedCell(this.iframe))
					this.actionButtons["Delete focus cell"] = this.addAction("eraser", "Delete focus cell", () => DeleteFocusedCell(this.iframe))
					this.actionButtons["Pick kernel"] = this.addAction("cpu", "Pick kernel", () => ChooseKernel(this.iframe))

				}
				if (ext !== "md" && ext !== 'nb') {
					this.actionButtons["Save"] = this.addAction("save", "Save", () => Save(this.iframe))

				}
				this.actionButtons["Save as"] = this.addAction("save-all", "Save as Wln file", () => SaveAs(this.iframe))
				this.actionButtons["Go back to origin"] = this.addAction("arrow-left",
					"Go back to the original markdown file - remember to save the changed",
					() => this.switchToNormalMode())
			}
		}

	}


	async onClose() {
		console.log("On close trigger")
		// await super.onClose()
		Object.entries(this.actionButtons).forEach(([k, v]) => {
			v.remove()


		})
		this.actionButtons = {}
		this.app.workspace.requestSaveLayout()


	}

	data: { serverAddress: string; originalFilePath: string };


}
