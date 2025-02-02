import {App, PluginSettingTab, Setting} from "obsidian";
import ObsidianWolframJsPlugin from "../main";

export type WolframJsSettings = {
	root_address:string;
	javascript:string,
	styles: string[]


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
			.setName("Server domain")
			.setDesc("The root url of the WolframJs server, usually include port number")
			.addText(text=> {
				text.setPlaceholder(this.plugin.DEFAULT_SETTTINGS.root_address);
				text.setValue(this.plugin.settings.root_address)
				text.onChange(async (value) => {
					this.plugin.settings.root_address = value;
					await this.plugin.saveData(this.plugin.settings)
				})
			})
	}
}
