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
	TFile
} from 'obsidian';
import WolframJsView, {WOLFRAMJS_VIEW_TYPE} from "./src/WolframjsView";
import { WolframJsSettings, WolframJsSettingsTab} from "./src/settings";
import {WOLFRAMJS_ICON_ID, WOLFRAMJS_ICON_SVG} from "./src/icon";
import * as path from "path";

// Remember to rename these classes and interfaces!


export default class ObsidianWolframJsPlugin extends Plugin {
	settings: WolframJsSettings;
	DEFAULT_SETTTINGS:WolframJsSettings = {
		root_address:"http://127.0.0.1:20560",
		path:"",
		default_home_dir:"",
		vault_path: (this.app.vault.adapter as FileSystemAdapter).getBasePath()
	}

	async onload() {
		await this.loadSettings();
		// This creates an icon in the left ribbon.

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new WolframJsSettingsTab(this.app, this));
		addIcon(WOLFRAMJS_ICON_ID, WOLFRAMJS_ICON_SVG)
		this.addRibbonIcon(WOLFRAMJS_ICON_ID, "Open Wolframjs", async () => {
			await this.activeView()
		})

		this.registerView(WOLFRAMJS_VIEW_TYPE, (leaf) => new WolframJsView(leaf, this, this.DEFAULT_SETTTINGS))
		this.addCommand({
			id: 'wolframjs-open-view',
			name: "Open wolfram js view",
			callback: () => this.activeView()
		})

		this.addRibbonIcon("shell", "Switch file to Wolfram view", async () => {
			await this.switchToWolframView()
		})
		this.registerFileMenu()


	}

	registerFileMenu() {
		this.registerEvent(this.app.workspace.on('file-menu', (menu,
															   file,
															   source,
															   leaf) => {
			let currentViewState = leaf?.view
			console.log(currentViewState?.getState())
			if (currentViewState instanceof MarkdownView) {
				menu.addItem((item) => {
					item
						.setTitle("Switch to WolframJs mode")
						.setIcon(WOLFRAMJS_ICON_ID)
						.onClick(() => {
							this.switchToWolframView()

						})
				})
			}
		}))
	}

	async switchToWolframView() {
		const leaf = this.app.workspace.getLeaf(false)
		// console.log(leaf.getViewState())
		const currentFile = this.app.workspace.getActiveFile()
		if (currentFile instanceof TFile) {

			const fileAbsolutePath = path.resolve((currentFile.vault.adapter as FileSystemAdapter).getBasePath(), currentFile.path)
			const newSettings: WolframJsSettings = {
				...this.settings,
				path: currentFile.path,
			}
			const view = new WolframJsView(leaf, this, newSettings)
			// this.registerView("wolframjs-file-view",(leaf)=>{
			// 	return view
			// })

			await leaf.open(view)
			await this.app.workspace.revealLeaf(leaf)
			// this.leafModeTracking[file.path]

			// console.log(leaf.getViewState())


		}


	}


	async activeView() {
		const leaf = this.app.workspace.getLeaf(true)
		await leaf.setViewState({
			type: WOLFRAMJS_VIEW_TYPE,
			active: true,
		})
		await this.app.workspace.revealLeaf(leaf)
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(WOLFRAMJS_VIEW_TYPE)
	}

	async loadSettings() {
		this.settings = Object.assign({}, this.DEFAULT_SETTTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


