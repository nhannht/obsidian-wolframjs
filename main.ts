import {
	addIcon,
	App,
	Editor,
	FileSystemAdapter,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile, ViewState, WorkspaceLeaf
} from 'obsidian';
import WolframTextFileView, {WOLFRAMJS_TEXT_FILE_VIEW_TYPE} from "./src/WolframTextFileView";
import {WolframJsSettings, WolframJsSettingsTab} from "./src/settings";
import {WOLFRAMJS_ICON_ID, WOLFRAMJS_ICON_SVG} from "./src/icon";
import * as path from "path";
import WolframJSItemView, {WOLFRAMJS_ITEM_VIEW_TYPE} from "./src/WolframJSItemView";

// Remember to rename these classes and interfaces!


export default class ObsidianWolframJsPlugin extends Plugin {
	settings: WolframJsSettings;
	DEFAULT_SETTTINGS: WolframJsSettings = {
		root_address: "http://127.0.0.1:20560",
	}

	async onload() {
		//region Load settings
		await this.loadSettings();
		//endregion
		// This creates an icon in the left ribbon.

		//region Add setting tabs
		this.addSettingTab(new WolframJsSettingsTab(this.app, this));
		//endregion

		//<editor-fold desc="Register custom Icon">
		addIcon(WOLFRAMJS_ICON_ID, WOLFRAMJS_ICON_SVG)
		//</editor-fold>

		//TODO add ribbon button to quick open wolfram view in root workspace
		// this.addRibbonIcon(WOLFRAMJS_ICON_ID, "Open Wolframjs", async () => {
		// 	await this.activeView()
		// })

		// register wolfram view
		this.registerView(WOLFRAMJS_TEXT_FILE_VIEW_TYPE, (leaf) => new WolframTextFileView(leaf, this))
		this.registerView(WOLFRAMJS_ITEM_VIEW_TYPE,(leaf)=> new WolframJSItemView(leaf,this))
		this.registerExtensions(['wl', 'wln'], WOLFRAMJS_TEXT_FILE_VIEW_TYPE)
		// this.addCommand({
		// 	id: 'wolframjs-open-view',
		// 	name: "Open wolfram js view",
		// 	callback: () => this.activeView()
		// })
		//
		// this.addRibbonIcon("shell", "Switch file to Wolfram view", async () => {
		// 	await this.switchToWolframView()
		// })
		this.registerFileMenu()
		// this.registerActions()
		this.addRibbonIcon("shell","this button do nothing",()=>{
			const currentLeaf = this.app.workspace.getActiveViewOfType(MarkdownView)
			if (currentLeaf){
				console.log(currentLeaf.getState())
			}
		})


	}

	//region Add some option to the menu of normal markdown view
	registerFileMenu() {
		this.registerEvent(this.app.workspace.on('file-menu', (menu,
															   file,
															   source,
															   leaf) => {
			let currentViewState = leaf?.view
			// console.log(currentViewState?.getState())
			if (currentViewState instanceof MarkdownView) {
				menu.addItem((item) => {
					item
						.setTitle("Switch to WolframJs mode")
						.setIcon(WOLFRAMJS_ICON_ID)
						.onClick(async () => {
							const newLeaf = this.app.workspace.getLeaf(false)

							const currentFile = this.app.workspace.getActiveFile()
							const wolframItemView = new WolframJSItemView(newLeaf,this)
							if (currentFile instanceof  TFile){
								wolframItemView.config = {
									serverAddress: this.settings.root_address,
									originalFilePath: currentFile.path,
								}
							}
							await newLeaf.open(wolframItemView)
							// await this.switchToWolframView(activeView.leaf)
						})
				})
			}
		}))
	}

	//TODO: registering a button to switch to wolfram view
	registerActions() {
		this.app.workspace.on("file-open", (file) => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView)
			if (view) {
				view.addAction(WOLFRAMJS_ICON_ID, "hello world", () => {
					console.log("hello")
				})

			}
		})


	}

	//endregion

	//region Function that handler to switch to WolframView of current file
	async switchToWolframView(leaf: WorkspaceLeaf) {
		// console.log(leaf.getViewState())
		await leaf.setViewState({
			type: WOLFRAMJS_TEXT_FILE_VIEW_TYPE,
			state: leaf.view.getState(),
		} as ViewState)
	}

	//endregion


	onunload() {
		this.app.workspace.detachLeavesOfType(WOLFRAMJS_TEXT_FILE_VIEW_TYPE)
	}

	async loadSettings() {
		this.settings = Object.assign({}, this.DEFAULT_SETTTINGS, await this.loadData());
	}

}


