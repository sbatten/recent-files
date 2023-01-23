// Test PR
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { RecentFilesProvider } from './recentFilesTreeView';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const treeDataProvider = new RecentFilesProvider(context);
	let registeredProvider = vscode.window.registerTreeDataProvider(
		'recentFiles',
		treeDataProvider
	);

	context.subscriptions.push(registeredProvider);
	context.subscriptions.push(treeDataProvider);
}

// This method is called when your extension is deactivated
export function deactivate() {}
