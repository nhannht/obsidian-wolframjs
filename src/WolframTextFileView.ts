import {
	debounce,
	FileSystemAdapter,
	IconName,
	ItemView,
	MarkdownView,
	Menu,
	TextFileView,
	TFile,
	WorkspaceLeaf
} from "obsidian";
import ObsidianWolframJsPlugin from "../main";
import {WolframJsSettings} from "./settings";
import * as path from "path";
import {WOLFRAMJS_ICON_ID} from "./icon";
// import {WolframJSSaveFileDialog} from "./SaveFileDialog";
import * as ct from "electron"
import {Abort, ChooseKernel, ClearOutputs, DeleteFocusedCell, Save, SaveAs, ToggleFocusedCell} from "./Action";

export const WOLFRAMJS_TEXT_FILE_VIEW_TYPE = "wolframjs-text-file-view"


export default class WolframTextFileView extends TextFileView {
	iframe: HTMLIFrameElement | null;


	constructor(leaf: WorkspaceLeaf,
				public plugin: ObsidianWolframJsPlugin,
	) {
		super(leaf);


	}

	getViewType(): string {
		return WOLFRAMJS_TEXT_FILE_VIEW_TYPE;
	}

	getDisplayText(): string {
		if (this.file) {
			return this.file.basename;
		} else {
			return "Wolframjs"
		}
	}

	async registerActionButtons() {
		if (this.file) {
			if (this.file.extension === "wln") {
				this.addAction("cpu", "Pick kernel", () => ChooseKernel(this.iframe))
				this.addAction("circle-stop", "Abort", () => Abort(this.iframe))
				this.addAction("list-x", "Clear output", () => ClearOutputs(this.iframe))

			}
			this.addAction("save-all", "Save as", () => SaveAs(this.iframe))
			this.addAction("save", "Save",()=>Save(this.iframe))
			this.addAction("toggle-left", "Toggle focus cell", () => ToggleFocusedCell(this.iframe))
			this.addAction("eraser", "Delete focus cell", () => DeleteFocusedCell(this.iframe))
			this.addAction("arrow-left",
				"Go back to the original markdown file - remember to save the changed",
				() => this.switchToNormalMode())
		}
	}


	// onPaneMenu(menu: Menu, source: "more-options" | "tab-header" | string) {
	// 	if (source !== 'more-options') {
	// 		super.onPaneMenu(menu, source);
	// 		return;
	// 	}
	// 	menu.addItem((item) => {
	// 		item.setTitle("Switch back to normal mode")
	// 			.setIcon(WOLFRAMJS_ICON_ID)
	// 			.setSection("pane")
	// 			.onClick(async () => {
	// 				await this.switchToNormalMode();
	// 			})
	// 	})
	// }

	private async switchToNormalMode() {
		const file = this.file
		// console.log(file)
		const leaf = this.app.workspace.getLeaf(false)

		if (file != null) {
			await leaf.setViewState({
				type: "markdown",
				state: leaf.view.getState()
			})
			// await leaf.openFile(file)
		}
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


	loadIframe(container: Element) {
		this.iframe = container.createEl('iframe');
		this.iframe.setAttribute('sandbox', 'allow-forms allow-presentation allow-same-origin allow-scripts')
		const vault_path = (this.app.vault.adapter as FileSystemAdapter).getBasePath()
		// console.log(vault_path)
		const file = this.file
		if (file instanceof TFile) {
			const fileAbsPath = path.resolve(vault_path, file.path)
			const url = new URL(path.join("/iframe/", fileAbsPath), this.plugin.settings.root_address)
			this.iframe.src = url.toString()
			// this.iframe.win.addEventListener('message', this.eventListener)


		}
	}

	getIcon(): IconName {
		return WOLFRAMJS_ICON_ID;
	}


	async onload() {
		super.onload();
		const container = this.containerEl.children[1];
		// console.log(this.file)
		try {
			setTimeout(() => this.loadIframe(container), 100)


		} catch (e) {
			console.error(e);
			const error = container.createDiv({text: e.toString()})

		}



		setTimeout(async ()=>{
			await this.registerActionButtons()
		},100)


	}


	async onClose() {
		// await super.onClose()
		// if (this.iframe) {
		// 	this.iframe.win.removeEventListener("message", this.eventListener)
		// }

	}

	clear(): void {
	}

	getViewData(): string {
		return ""
	}

	setViewData(data: string, clear: boolean): void {
	}
}
