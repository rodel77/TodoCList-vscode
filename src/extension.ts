// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {ExtensionContext, window, commands} from "vscode";

import {TodoCListView, Task, Project} from "./todolistView";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "todoclist-vscode" is now active!');

	const todoclistView = new TodoCListView();
	context.subscriptions.push(window.registerTreeDataProvider("todoclist", todoclistView));
	context.subscriptions.push(commands.registerCommand("todoclist.refresh", () => todoclistView.refresh()));
	context.subscriptions.push(commands.registerCommand("todoclist.complete", (task: Task) => {
		task.complete();
		todoclistView.refresh();
	}));
	context.subscriptions.push(commands.registerCommand("todoclist.delete", (task: Task) => {
		task.delete();
		todoclistView.refresh();
	}));
	context.subscriptions.push(commands.registerCommand("todoclist.add", (project: Project) => {
		window.showInputBox({prompt: "New task name for '"+project.name+"'"}).then((name) => {
			if(name){
				project.add(name);
				todoclistView.refresh();
			}
		});
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {}
