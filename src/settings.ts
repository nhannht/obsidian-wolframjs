import {App, PluginSettingTab, Setting} from "obsidian";
import ObsidianWolframJsPlugin from "../main";

export type WolframJsSettings = {
	url?:string;
}

export const DEFAULT_SETTTINGS:WolframJsSettings = {
	url:"http://127.0.0.1:20560"
}

export class WolframJsSettingsTab extends PluginSettingTab {
	constructor(app:App,private plugin: ObsidianWolframJsPlugin) {
		super(app,plugin)
	}
	display():void{
		const {containerEl} = this;
		containerEl.empty();
		containerEl.createEl('h2',{text:"WolframJs Plugin Settings"});

		new Setting(containerEl)
			.setName("Server url")
			.setDesc("The url of the WolframJs server")
			.addText(text=>{

				if (DEFAULT_SETTTINGS.url != null) {
					text.setPlaceholder(DEFAULT_SETTTINGS.url);


				}
				if (this.plugin.settings.url != null) {
					text.setValue(this.plugin.settings.url)
				}
				text.onChange(async (value)=>{
					this.plugin.settings.url = value;
					await this.plugin.saveData(this.plugin.settings)
				})
			})
	}
}
