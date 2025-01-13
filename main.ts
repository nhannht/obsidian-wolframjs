import {addIcon, App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting} from 'obsidian';
import WolframJsView, {WOLFRAMJS_VIEW_TYPE} from "./src/WolframjsView";
import {DEFAULT_SETTTINGS, WolframJsSettings, WolframJsSettingsTab} from "./src/settings";
import {WOLFRAMJS_ICON_ID, WOLFRAMJS_ICON_SVG} from "./src/icon";

// Remember to rename these classes and interfaces!



export default class ObsidianWolframJsPlugin extends Plugin {
	settings: WolframJsSettings;

	async onload() {
		await this.loadSettings();
		// This creates an icon in the left ribbon.

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new WolframJsSettingsTab(this.app, this));
		addIcon(WOLFRAMJS_ICON_ID,WOLFRAMJS_ICON_SVG)
		this.addRibbonIcon(WOLFRAMJS_ICON_ID,"Open Wolframjs",async ()=>{
			await this.activeView()
		})

		this.registerView(WOLFRAMJS_VIEW_TYPE,(leaf)=> new WolframJsView(leaf))
		this.addCommand({
			id:'wolframjs-open-view',
			name:"Open wolfram js view",
			callback:()=>this.activeView()
		})
	}
	async activeView(){
		const leaf = this.app.workspace.getLeaf(true)
		await leaf.setViewState({
			type:WOLFRAMJS_VIEW_TYPE,
			active:true,
		})
		await this.app.workspace.revealLeaf(leaf)
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(WOLFRAMJS_VIEW_TYPE)
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


