import * as vscode from 'vscode';
import { WorkspaceFolder, DebugConfiguration, ProviderResult, CancellationToken } from 'vscode';

class llConfigurationProvider implements vscode.DebugConfigurationProvider {

	/**
	 * Massage a debug configuration just before a debug session is being launched,
	 * e.g. add all missing attributes to the debug configuration.
	 */
	resolveDebugConfiguration(folder: WorkspaceFolder | undefined, config: DebugConfiguration, token?: CancellationToken): ProviderResult<DebugConfiguration> {

		// if launch.json is missing or empty
		if (!config.type && !config.request && !config.name) {
			const editor = vscode.window.activeTextEditor;
			if (editor && editor.document.languageId === 'markdown') {
				config.type = 'll';
				config.name = 'Launch';
				config.request = 'launch';
				config.program = '${file}';
				config.stopOnEntry = true;
			}
		}

		if (!config.program) {
			return vscode.window.showInformationMessage("Cannot find a program to debug").then(_ => {
				return undefined;	// abort launch
			});
		}

		return config;
	}
}
class DebugAdapterExecutableFactory implements vscode.DebugAdapterDescriptorFactory {

	// The following use of a DebugAdapter factory shows how to control what debug adapter executable is used.
	// Since the code implements the default behavior, it is absolutely not neccessary and we show it here only for educational purpose.

	createDebugAdapterDescriptor(_session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): ProviderResult<vscode.DebugAdapterDescriptor> {
		// param "executable" contains the executable optionally specified in the package.json (if any)

		// use the executable specified in the package.json if it exists or determine it based on some other information (e.g. the session)
		if (!executable) {
			const command = "absolute path to my DA executable";
			const args = ["test"];
			const options = {
				cwd: "working directory for executable",
				env: { "envVariable": "some value" }
			};
			executable = new vscode.DebugAdapterExecutable(command, args, options);
		}
		return new vscode.DebugAdapterExecutable(
				executable.command, // dap.exe路径
				['--port=4711'], // 传给dap.exe的参数（可选）
				{ cwd: vscode.workspace.rootPath } // 工作目录
		);
		// make VS Code launch the DA executable
		return executable;
	}
}
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "ll" is now active!');
	const disposable = vscode.commands.registerCommand('ll.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from ll!');
		console.log(":123123");
	});
	context.subscriptions.push(disposable);

	context.subscriptions.push(vscode.commands.registerCommand('extension.ll-debug.getProgramName', config => {
		return vscode.window.showInputBox({
			placeHolder: "Please enter the name of a ll file in the workspace folder",
			value: "trest.ll"
		});
	}));
    // const provider = new llConfigurationProvider();
	// context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('ll-debug', provider));
    const factory = new DebugAdapterExecutableFactory();
	context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory('ll-debug', factory));
	// 可选：注册调试适配器追踪器，打印dap.exe的日志（方便调试）
	context.subscriptions.push(
		vscode.debug.registerDebugAdapterTrackerFactory('ll-debugger', {
			createDebugAdapterTracker: (session) => {
				return {
				onDidSendMessage: (msg:any) => console.log('DAP Send:', msg),
				onDidReceiveMessage: (msg:any) => console.log('DAP Receive:', msg)
				};
			}
		})
	);
    // context.subscriptions.push(vscode.languages.registerEvaluatableExpressionProvider('ll-debug', {
	// 	provideEvaluatableExpression(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.EvaluatableExpression> {
	// 		console.log("表达式求值",position);
	// 		return undefined;
	// 	}
	// }));
	// context.subscriptions.push(vscode.languages.registerInlineValuesProvider('ll-debug', {
	// 	provideInlineValues(document: vscode.TextDocument, viewport: vscode.Range, context: vscode.InlineValueContext) : vscode.ProviderResult<vscode.InlineValue[]> {
	// 		const allValues: vscode.InlineValue[] = [];
	// 		console.log("行内求值",);			
	// 		return allValues;
	// 	}
	// }));

}
export function deactivate() {}
