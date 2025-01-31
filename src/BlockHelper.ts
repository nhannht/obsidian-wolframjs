import ObsidianWolframJsPlugin, {delay} from "../main";
import {request} from "obsidian";
import {WolframJsSettings} from "./settings";

export default class BlockHelper {
	constructor(public plugin:ObsidianWolframJsPlugin) {}
	fetchBundleJs = async () => {
		const res = await request({
			url: "http://127.0.0.1:20560/api/extensions/bundle/minjs/",
			method: "POST",

		})
		const result = JSON.parse(res) as string;
		let tempSettings = structuredClone(this.plugin.settings) as WolframJsSettings
		tempSettings.extensions = decodeURIComponent(result)
		console.log(tempSettings)
		await this.plugin.saveData(tempSettings)
	}

	fetchStyle = async () => {
		const listRes = await request({url: 'http://127.0.0.1:20560/api/extensions/list/', method: 'POST'});
		const listData = JSON.parse(listRes) as {
			name: string,
			version: string
		}[];

		const exts = listData.map((e) => e.name);
		const styleRes = await request({
			url: 'http://127.0.0.1:20560/api/extensions/get/styles/',
			method: 'POST',
			body: JSON.stringify(exts),
		});
		const styleData = JSON.parse(styleRes) as string[];
		let tempSettings = structuredClone(this.plugin.settings) as WolframJsSettings
		let decodeStyleData = styleData.map((e) => decodeURIComponent(e))
		tempSettings.styles = decodeStyleData
		await this.plugin.saveData(tempSettings)
	}

	setUpServerAPI = () => {
		console.log("Settup server api")
		// @ts-ignore
		const getObject = async (kernel: any, uid: any) => {
			console.log("trigger getObject")
			let r = await fetch('http://127.0.0.1:20560/api/frontendobjects/get/', {
				method:'POST',
				body:JSON.stringify({
					'UId': uid,
					"Kernel": kernel
				})
			});

			r = await r.json();

			if (r.Resolved == true) {
				return JSON.parse(r.Data);
			}

			await delay(300);

			return await getObject(kernel, uid)



		}

		//implementation of get method depends on execution env
		window.ObjectStorage.prototype.get = function () {
			console.log("Window object storage triggered")
			if (this.cached) return this.cache;
			const self = this;
			const promise = new Deferred();

			getObject(this.targetKernel, self.uid).then((result: any) => {
				self.cache = result;
				promise.resolve(self.cache);
			}, (rejected) => {
				console.warn('Rejected! Not found');
				promise.reject();
			})

			return promise.promise;
		}
	}

	findKernel = async (): Promise<string> => {
		const res = await request({
			method: 'POST',
			url: 'http://127.0.0.1:20560/api/kernels/list/'
		});

		const body = JSON.parse(res)

		const valid = body.filter((el: { ContainerReadyQ: any; }) => el.ContainerReadyQ);
		if (valid.length == 0) {
			await delay(300);
			return await this.findKernel();
		}

		return valid[0].Hash;
	}

	getResult = async (kernel: string, transaction: string) => {
		await delay(300);

		let result = await request({
			method: 'POST',
			body: JSON.stringify({
				'Hash': transaction
			}),
			url: 'http://127.0.0.1:20560/api/transactions/get/'
		});


		result = JSON.parse(result);
		console.log(result);

		if (result.State !== 'Idle') {
			result = await this.getResult(kernel, transaction);
		}


		return result.Result;

	}


	registerWoffBlock = async ()=>{
		this.plugin.registerMarkdownCodeBlockProcessor("wolf", async (src, el, ctx) => {

			await delay(300)
			const resultsDiv = el.createDiv()
			el.createEl("script", {
				attr: {
					"type": "module",
				},
				text: this.plugin.settings.extensions
			})
			this.plugin.settings.styles.forEach(style => {
				const tag = el.doc.head.createEl("style", {
					text: style,
				})

			})

			let transaction = await request({
				url: 'http://127.0.0.1:20560/api/transactions/create/',
				method: 'POST',
				body: JSON.stringify({
					'Kernel': this.plugin.targetKernel,
					'Data': '1+1'
				})
			});
			transaction = JSON.parse(transaction);
			if (this.plugin.targetKernel != null) {
				const results = await this.getResult(this.plugin.targetKernel, transaction);
			console.log(results);
				results.forEach((data) => {
					console.log(data)

					const display = data.Display || 'codemirror';
					console.log(display)
					const parentelement = el.createDiv()
					// resultsDiv.appendChild(parentelement);

					const origin = {
						element: parentelement
					};
					console.log(origin)

					const cell = new window.SupportedCells[display].view(origin, data.Data);
					el.appendChild(cell)


					//to remove use

					//cell.dispose()
				})
			}

			// console.log(window.ObjectStorage)


		})

	}




}
