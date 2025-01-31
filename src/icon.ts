// @ts-ignore
import iconString from "inline:./wolframIcon.svg"
export const WOLFRAMJS_ICON_ID = "wolframjs";

export const WOLFRAMJS_ICON_SVG = (iconString as string).replace("<?xml version=\"1.0\" ?>","")

export function inlineImportDebug (){
	console.log(iconString)
}

