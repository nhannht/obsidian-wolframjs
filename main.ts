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
import WolframJsItemView, {WOLFRAMJS_VIEW_TYPE} from "./src/WolframJsItemView";
import {WolframJsSettings, WolframJsSettingsTab} from "./src/settings";
import {WOLFRAMJS_ICON_ID, WOLFRAMJS_ICON_SVG} from "./src/icon";
import * as path from "path";

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
		this.registerView(WOLFRAMJS_VIEW_TYPE, (leaf) => new WolframJsItemView(leaf, this))
		this.registerExtensions(['wl','nb','wls','m','wln'], WOLFRAMJS_VIEW_TYPE)
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
							const activeView = this.app.workspace.getActiveViewOfType(MarkdownView)
							if (activeView) {
								await this.switchToWolframView(activeView.leaf)
							}
						})
				})
			}
		}))
	}

	//endregion

	//region Function that handler to switch to WolframView of current file
	async switchToWolframView(leaf: WorkspaceLeaf) {
		// console.log(leaf.getViewState())
		await leaf.setViewState({
			type: WOLFRAMJS_VIEW_TYPE,
			state: leaf.view.getState(),
		} as ViewState)
	}

	//endregion


	onunload() {
		this.app.workspace.detachLeavesOfType(WOLFRAMJS_VIEW_TYPE)
	}

	async loadSettings() {
		this.settings = Object.assign({}, this.DEFAULT_SETTTINGS, await this.loadData());
	}

}


