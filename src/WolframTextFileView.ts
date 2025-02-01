import {IconName, TextFileView, TFile, View, ViewStateResult, WorkspaceLeaf} from "obsidian";
import ObsidianWolframJsPlugin from "../main";
import {WOLFRAMJS_ICON_ID} from "./icon";
import {EditorView} from "@codemirror/view";
import {EditorState, Extension} from "@codemirror/state";
import WolframJSItemView from "./WolframJSItemView";
import {switchToWolframView} from "./Action";

export const WOLFRAMJS_TEXT_FILE_VIEW_TYPE = "wolframjs-text-file-view"


export default class WolframTextFileView extends TextFileView {
	iframe: HTMLIFrameElement | null;
	codeMirror: EditorView;
	extensions: Extension[];
	actionButtons: Record<string, HTMLElement>


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


	async registerActionButtons() {
		if (this.file) {
			this.actionButtons["Switch to wolfram view"] = this.addAction(WOLFRAMJS_ICON_ID, "Switch to WolframJs mode", async () => {
				// this.leaf.detach()

				await switchToWolframView(this.file,this.plugin.settings.root_address)
			})
		}
	}


	async onLoadFile(file: TFile) {
		await super.onLoadFile(file)

		await this.registerActionButtons()
		// console.log(this.iframe?.src)


	}

	getIcon(): IconName {
		return WOLFRAMJS_ICON_ID;
	}


	clear(): void {
		// console.log("clear")
		Object.entries(this.actionButtons).forEach(([k, v]) => {
			v.remove()

		})
		this.actionButtons = {}


	}


	protected async onClose() {

	}

	canAcceptExtension(extension: string): boolean {
		return (["wln", "wl", "nb"].includes(extension))
	}


	getViewData() {


		return this.codeMirror.state.doc.toString()


	}




	setViewData(data: string, clear: boolean): void {
		// console.log("Set view data")
		// this.plugin.addView(this,this.plugin,data).then()
		if (clear) {
			this.clear()
		}
		this.codeMirror.setState(EditorState.create({
			doc: data,
			extensions: this.extensions,
		}))
	}
}
