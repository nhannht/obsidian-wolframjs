import {ItemView, Menu, TFile, WorkspaceLeaf} from "obsidian";
import ObsidianWolframJsPlugin from "../main";
import {WolframJsSettings} from "./settings";
import * as path from "path";
import {WOLFRAMJS_ICON_ID} from "./icon";


export const WOLFRAMJS_VIEW_TYPE = "wolframjs-view"


export default class WolframJsView extends ItemView {
	constructor(leaf: WorkspaceLeaf,
				public plugin: ObsidianWolframJsPlugin,
				public customConfig: WolframJsSettings) {
		super(leaf);

	}

	getViewType(): string {
		return WOLFRAMJS_VIEW_TYPE;
	}

	getDisplayText(): string {
		return `Wolframjs`
	}

	getState(): Record<string, unknown> {
		if (this.customConfig.path) {

			const file = this.plugin.app.vault.getFileByPath(this.customConfig.path)
			if (file) {
				return {
					...super.getState(),
					file: file.path,
					backlinks:true,
					source:false

				}
			}
		}
		return {
			...super.getState(),
		}
	}

	 onPaneMenu(menu: Menu, source: "more-options" | "tab-header" | string) {
		 if (source !== 'more-options') {
			 super.onPaneMenu(menu, source);
			 return;
		 }
		menu.addItem((item)=>{
			item.setTitle("Switch back to normal mode")
				.setIcon(WOLFRAMJS_ICON_ID)
				.setSection("pane")
				.onClick(async ()=>{
					await this.switchToNormalMode();
				})
		})
	}

	private async switchToNormalMode() {
		const leaf = this.app.workspace.getLeaf(false)
		if (this.customConfig.path != null) {
			const file = this.app.vault.getFileByPath(this.customConfig.path)
			if (file) {
				await leaf.openFile(file)
			}
		}
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		try {
			const iframe = container.createEl('iframe');
			iframe.setAttribute('sandbox', 'allow-forms allow-presentation allow-same-origin allow-scripts')

			if (this.customConfig.path) {
				const file = this.plugin.app.vault.getFileByPath(this.customConfig.path)
				// console.log(this.customConfig.vault_path)
				if (file instanceof TFile) {
					if (this.customConfig.vault_path) {
						const fileAbsPath = path.resolve(this.customConfig.vault_path, file.path)
						const url = new URL(path.join("/folder/", fileAbsPath), this.customConfig.root_address)
						// console.log(url)
						iframe.src = url.toString()
					}
				}
			}
		} catch (e) {
			console.error(e);
			const error = container.createDiv({text: e.toString()})

		}

		this.addAction(WOLFRAMJS_ICON_ID,"Switch to normal mode",async ()=> await this.switchToNormalMode())


	}

	async onClose() {

	}
}
