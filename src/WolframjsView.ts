import {ItemView,WorkspaceLeaf} from "obsidian";


export const WOLFRAMJS_VIEW_TYPE = "wolframjs-view"

export default class WolframJsView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
        super(leaf);

    }

	getViewType(): string {
		return WOLFRAMJS_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Wolframjs"
	}

	  async  onOpen() {
		const container = this.containerEl.children[1];
		try {
			const iframe = container.createEl('iframe');
			iframe.setAttribute('sandbox','allow-forms allow-presentation allow-same-origin allow-scripts')
			iframe.src = "http://localhost:20560"
		} catch (e){
			console.error(e);
			const error = container.createDiv({text:e.toString()})


		}

	}
	async onClose(){

	}
}
