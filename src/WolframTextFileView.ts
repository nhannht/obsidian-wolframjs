import {
	debounce,
	FileSystemAdapter,
	IconName,
	ItemView,
	MarkdownView,
	Menu,
	TextFileView,
	TFile, ViewStateResult,
	WorkspaceLeaf
} from "obsidian";
import ObsidianWolframJsPlugin from "../main";
import {WolframJsSettings} from "./settings";
import * as path from "path";
import {WOLFRAMJS_ICON_ID} from "./icon";
import * as ct from "electron"
import {Abort, ChooseKernel, ClearOutputs, DeleteFocusedCell, Save, SaveAs, ToggleFocusedCell} from "./Action";
import {EditorView} from "@codemirror/view";
import {EditorState, Extension} from "@codemirror/state";
import {history} from "@codemirror/commands"
import WolframJSItemView, {WOLFRAMJS_ITEM_VIEW_TYPE} from "./WolframJSItemView";

export const WOLFRAMJS_TEXT_FILE_VIEW_TYPE = "wolframjs-text-file-view"


export default class WolframTextFileView extends TextFileView {
	iframe: HTMLIFrameElement | null;
	codeMirror: EditorView;
	extensions: Extension[];
	actionButtons :Record<string,HTMLElement>


	constructor(leaf: WorkspaceLeaf,
				public plugin: ObsidianWolframJsPlugin,
	) {
		super(leaf);
		this.codeMirror = new EditorView({
			parent: this.contentEl
		})
		this.actionButtons = {}
		this.extensions = [
			EditorView.lineWrapping,
			EditorView.editorAttributes.of({class: "orgmode-view"}),
			EditorView.editorAttributes.of({class: "mod-cm6"}),
			EditorView.baseTheme({
				".cm-gutters": {
					backgroundColor: "unset !important",
					border: "unset !important",
				},
				".open-fold-icon": {
					opacity: "0",
				},
				".open-fold-icon:hover": {
					opacity: "1",
				},
				".cm-panels": {
					backgroundColor: "#2e2e2e",
				},
			}),
			EditorView.updateListener.of((v) => {
				if (v.docChanged) {
					this.requestSave()

				}
			})

		]

	}

	getViewType(): string {
		return WOLFRAMJS_TEXT_FILE_VIEW_TYPE;
	}

	getDisplayText(): string {
		if (this.file) {
			return this.file.path;
		} else {
			return "Wolframjs"
		}
	}

	async switchToWolframView() {
		const newLeaf = this.app.workspace.getLeaf(false)

		const wolframItemView = new WolframJSItemView(newLeaf,this.plugin)
		if (this.file instanceof  TFile){
			wolframItemView.config = {
				serverAddress: this.plugin.settings.root_address,
				originalFilePath: this.file.path,
			}
		}
		await newLeaf.open(wolframItemView)
		await newLeaf.setViewState({
			type: WOLFRAMJS_ITEM_VIEW_TYPE,
			active: true
		})

	}

	async registerActionButtons() {
		if (this.file) {
			this.actionButtons["Switch to wolfram view"] = this.addAction(WOLFRAMJS_ICON_ID, "Switch to WolframJs mode", async () => {
				await this.switchToWolframView()
			})
		}
	}


	async onLoadFile(file: TFile) {
		await super.onLoadFile(file)

		await this.registerActionButtons()
		// console.log(this.iframe?.src)


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



	getIcon(): IconName {
		return WOLFRAMJS_ICON_ID;
	}


	clear(): void {
		// console.log("clear")
		Object.entries(this.actionButtons).forEach(([k,v])=>{
			v.remove()

		})
		this.actionButtons = {}


	}


	protected  async  onClose() {

	}

	canAcceptExtension(extension: string): boolean {
		return (["wln", "wl"].includes(extension))
	}


	getViewData() {


		return this.codeMirror.state.doc.toString()


	}

	getState(): Record<string, unknown> {
		// console.log("Get state")
		return {
			type: WOLFRAMJS_TEXT_FILE_VIEW_TYPE,

		}
	}

	setState(state: any, result: ViewStateResult): Promise<void> {
		return super.setState(state, result);
	}


	setViewData(data: string, clear: boolean): void {
		// console.log("Set view data")
		// this.plugin.addView(this,this.plugin,data).then()
		if (clear){
			this.clear()
		}
		this.codeMirror.setState(EditorState.create({
			doc: data,
			extensions: this.extensions,
		}))
	}
}
