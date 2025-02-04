//@ts-nocheck
import ObsidianWolframJsPlugin, {delay} from "../main";
import {request} from "obsidian";
import {WolframJsSettings} from "./settings";

export default class BlockHelper {
	constructor(public plugin: ObsidianWolframJsPlugin) {
	}

	fetchBundleJs = async () => {
		let listExts = await request('http://127.0.0.1:20560/api/extensions/list/', { method: 'POST' });
		listExts = JSON.parse(listExts) as Array[any];

        listExts = listExts.map((e) => e.name);

		const res = await request({
			url: "http://127.0.0.1:20560/api/extensions/get/minjs/",
			method: "POST",
			body: JSON.stringify(listExts)
		})

		const result = JSON.parse(res) as Array[String]; 

		// console.log(result)
		let tempSettings = structuredClone(this.plugin.settings) as WolframJsSettings
		tempSettings.javascript = result.map(decodeURIComponent);
		console.log(tempSettings)
		await this.plugin.saveData(tempSettings)
		//await this.plugin.loadSettings()
		// console.log(this.plugin.settings) 
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

	setUpServerAPI = async (targetKernel) => {
		console.log("Settup server api")

		this.targetKernel = targetKernel;
		const parentSelf = this;

		// @ts-ignore
		const getObject = async (kernel: any, uid: any) => {
			if (!kernel) {
				//implement sort of caching.
				//probably one can store data either inside a cell (might be a bit too big)
				//or use fflate library to compress / decompress the resulting JSON expression
				//so that it can work without running WLJS too
			}

			console.log("trigger getObject")
			//console.log(kernel);
			let r = await fetch('http://127.0.0.1:20560/api/frontendobjects/get/', {
				method: 'POST',
				body: JSON.stringify({
					'UId': uid,
					"Kernel": kernel
				})
			});

			r = await r.json();


			if (r.Resolved == true) {
				console.log("r is resolved")
				return JSON.parse(r.Data);
			}

			await delay(300);

			return await getObject(kernel, uid)


		}

		window.ObjectStorage.prototype.get = function () {
			console.log("Window object storage triggered")
			if (this.cached) return this.cache;
			const self = this;
			const promise = new Deferred();

			getObject(parentSelf.targetKernel, self.uid).then((result: any) => {
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
		//console.log(result.State);

		if (result.State !== 'Idle') {
			result = await this.getResult(kernel, transaction);
		}

		//console.warn(result);
		return result;

	}

	loadCustomScriptAndStyle = async () => {
		// console.log("load custom js")
		// await this.plugin.loadSettings()
		// console.log(this.plugin.settings)
		const wolframJavascriptModules = [] as Array[HTMLElement];

		this.plugin.wolframJavascript = this.plugin.settings.javascript.map(element => {
			const htmlElement = document.createElement("script");
			htmlElement.type = "module";
			htmlElement.innerHTML = element;
			document.documentElement.appendChild(htmlElement);
			return htmlElement;
		});

		this.plugin.settings.styles.forEach((s, i) => {
			let css = document.createElement("style")
			css.textContent = s
			css.addClass("wolfram-external-css")
			this.plugin.wolframCss.push(css)
			document.head.appendChild(css)

		})


	}


	registerWoffBlock = async () => {
		this.plugin.registerMarkdownCodeBlockProcessor("wolf", async (src, el, ctx) => {
			await delay(300)

			let transaction = await request({
				url: 'http://127.0.0.1:20560/api/transactions/create/',
				method: 'POST',
				body: JSON.stringify({
					'Kernel': this.plugin.targetKernel,
					'Data': src
				})
			});
			transaction = JSON.parse(transaction);
			if (this.plugin.targetKernel != null) {
				const results = (await this.getResult(this.plugin.targetKernel, transaction)).Result;
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


					//to remove use, otherwise it might cause a memory leak
					//cell.dispose()
				})
			}

			// console.log(window.ObjectStorage)


		})

	}


}
