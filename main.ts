import {addIcon, MarkdownView, Plugin, TFile, View} from 'obsidian';
import WolframTextFileView, {WOLFRAMJS_TEXT_FILE_VIEW_TYPE} from "./src/WolframTextFileView";
import {WolframJsSettings, WolframJsSettingsTab} from "./src/settings";
import {WOLFRAMJS_ICON_ID, WOLFRAMJS_ICON_SVG} from "./src/icon";
import WolframJSItemView, {WOLFRAMJS_ITEM_VIEW_TYPE} from "./src/WolframJSItemView";
import {switchToWolframView} from "./src/Action";
// Remember to rename these classes and interfaces!

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default class ObsidianWolframJsPlugin extends Plugin {
	settings: WolframJsSettings;
	DEFAULT_SETTTINGS: WolframJsSettings = {
		root_address: "http://127.0.0.1:20560",
		extensions: "",
		styles: []
	}
	wolframButton: HTMLElement | null;
	targetKernel: string | null = null;

	// blockHelper = new BlockHelper(this)


	async onload() {
		// inlineImportDebug()
		//region Load settings
		// const kernel = await this.blockHelper.findKernel();
		// this.targetKernel = kernel;
		// this.blockHelper.setUpServerAPI()
		await this.loadSettings();
		// await this.blockHelper.fetchBundleJs()
		// await this.blockHelper.fetchStyle()
		// await this.blockHelper.registerWoffBlock()
		//endregion
		// This creates an icon in the left ribbon.

		//region Add setting tabs
		this.addSettingTab(new WolframJsSettingsTab(this.app, this));
		//endregion

		//<editor-fold desc="Register custom Icon">
		addIcon(WOLFRAMJS_ICON_ID, WOLFRAMJS_ICON_SVG)
		//</editor-fold>


		// register wolfram view
		this.registerView(WOLFRAMJS_TEXT_FILE_VIEW_TYPE, (leaf) => new WolframTextFileView(leaf, this))
		// @ts-ignore
		this.registerView(WOLFRAMJS_ITEM_VIEW_TYPE, (leaf) => new WolframJSItemView(leaf, this, ""))
		// wolframjs currently supprot wln,wl,nb but not m or wls
		this.registerExtensions(['wl', 'wln', "nb"], WOLFRAMJS_TEXT_FILE_VIEW_TYPE)

		// this.registerFileMenu()
		// this.registerActions()
		this.registerEvent(this.app.workspace.on("file-open", () => {
			const currentView = this.app.workspace.getActiveViewOfType(MarkdownView)
			if (currentView) {
				if (this.wolframButton) {
					this.wolframButton.remove()
				}
				this.wolframButton = currentView.addAction(WOLFRAMJS_ICON_ID, "Switch to Wolfram View", this.switchToWolframView)

			}
		}))


	}


	//region Add some option to the menu of normal markdown view
	// registerFileMenu() {
	// 	this.registerEvent(this.app.workspace.on('file-menu', (menu,
	// 														   file,
	// 														   source,
	// 														   leaf) => {
	// 		let currentViewState = leaf?.view
	// 		// console.log(currentViewState?.getState())
	// 		if (currentViewState instanceof MarkdownView) {
	// 			menu.addItem((item) => {
	// 				item
	// 					.setTitle("Switch to WolframJs mode")
	// 					.setIcon(WOLFRAMJS_ICON_ID)
	// 					.onClick(this.switchToWolframView)
	// 			})
	// 		}
	// 	}))
	// }


	//endregion

	//region Function that handler to switch to WolframView of current file
	switchToWolframView = async () => {
		const newLeaf = this.app.workspace.getLeaf(false)

		const currentFile = this.app.workspace.getActiveFile()
		await switchToWolframView(currentFile,this.settings.root_address)
		// await this.app.workspace.vi(newLeaf)

		// await this.switchToWolframView(activeView.leaf)
	}

	//endregion


	onunload() {
		this.app.workspace.detachLeavesOfType(WOLFRAMJS_TEXT_FILE_VIEW_TYPE)

	}

	async loadSettings() {
		this.settings = Object.assign({}, this.DEFAULT_SETTTINGS, await this.loadData());
	}

}


