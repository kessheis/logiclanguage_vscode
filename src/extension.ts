import * as vscode from 'vscode';
import { WorkspaceFolder, DebugConfiguration, ProviderResult, CancellationToken } from 'vscode';
import { spawn } from 'child_process';

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

function spawnSyncWrapper(command:string, args?: readonly string[],options?: object) : any{
  return new Promise((resolve, reject) => {
    const child = spawn(command, args,options);
	child.stdout.setEncoding('utf8');
    // 拼接标准输出
    child.stdout.on('data', (data) => {
	  resolve({ code:200,"data":data });
    });

    // 拼接标准错误
    child.stderr.on('data', (data) => {
	  reject({ code:500,"data":`子进程输出错误:${data}` });
    });

    // 进程退出时返回结果
    child.on('close', (code) => {
	  reject({ code:500,"data":`子进程输出错误:子进程退出启动` });
    });

    // 进程启动失败（如命令不存在）
    child.on('error', (err) => {
	  reject({ code:500,"data":`子进程启动失败：${err.message}`});
    });
  });
}
class DebugAdapterExecutableFactory implements vscode.DebugAdapterDescriptorFactory {

	// The following use of a DebugAdapter factory shows how to control what debug adapter executable is used.
	// Since the code implements the default behavior, it is absolutely not neccessary and we show it here only for educational purpose.

	async createDebugAdapterDescriptor(_session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable): Promise<ProviderResult<vscode.DebugAdapterDescriptor>> {
		const port = _session.configuration.port ;
		let command = "";
		if(!executable)
		{
			vscode.window.showErrorMessage(`启动调试适配器失败: 无法找到ll_debug的调试适配器`);
			throw new Error('启动调试适配器失败: 无法找到ll_debug的调试适配器');
		}
		else
		{
			command = executable.command;
			if(port > -1)
			{
				let newPort = port;
				const result = await spawnSyncWrapper(command, [`--port=${port}`],{cwd: vscode.workspace.rootPath,stdio: ['pipe', 'pipe', 'pipe']});
				console.log('ll DebugStart：', result);
				if(result.code == 200)
				{
					newPort = Number.parseInt(result.data);		
					return new vscode.DebugAdapterServer(newPort);					
				}
				else
				{
					vscode.window.showErrorMessage(`启动调试适配器失败: 无法找到ll_debug的调试适配器`);
					throw new Error('启动调试适配器失败: 无法找到ll_debug的调试适配器');
				}
			}
			else
			{
				return new vscode.DebugAdapterExecutable(command,[''], { cwd: vscode.workspace.rootPath });
			}
		}
	}
}
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "ll" is now active!');
	const disposable = vscode.commands.registerCommand('ll.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from ll!');
		console.log(":123123");
	});
	context.subscriptions.push(disposable);
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
