import * as vscode from 'vscode';
import * as path from 'path';

interface ISerializedFile {
  serializedUri: string;
  fileName: string;
}

export class RecentFilesProvider extends vscode.Disposable implements vscode.TreeDataProvider<RecentFile> {
  private model: RecentFile[] = [];
  private disposables: vscode.Disposable[] = [];

  private _onDidChangeTreeData: vscode.EventEmitter<void | RecentFile | RecentFile[] | null | undefined> =
    new vscode.EventEmitter<void | RecentFile | RecentFile[] | null | undefined>();
  onDidChangeTreeData?: vscode.Event<void | RecentFile | RecentFile[] | null | undefined> | undefined =
    this._onDidChangeTreeData.event;

  constructor(private readonly context: vscode.ExtensionContext) {
    super(() => this.dispose());

    this.model = context.workspaceState.get('recentFiles', [])
      .map((serialized: ISerializedFile) => RecentFile.fromJSON(serialized));

    vscode.workspace.textDocuments.forEach((document) => {
      this.addFile(document);
    });

    this.disposables.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        this.addFile(editor.document);
        this._onDidChangeTreeData.fire(undefined);
      }
    }));
  }

  private addFile(document: vscode.TextDocument) {
    let found = this.model.find((file) => file.uri.path === document.uri.path)
    if (found === undefined) { 
      this.model.splice(0, 0, new RecentFile(document.uri, path.basename(document.fileName)));
      this.context.workspaceState.update('recentFiles', this.model.map((file) => file.toJSON()));
    }else if(found.uri.toString() !== document.uri.toString()){
      this.model.splice(this.model.indexOf(found), 1, new RecentFile(document.uri, path.basename(document.fileName)))
      this.context.workspaceState.update('recentFiles', this.model.map((file) => file.toJSON()));
    }
  }

  getTreeItem(element: RecentFile): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: RecentFile | undefined): vscode.ProviderResult<RecentFile[]> {
    if (element instanceof RecentFile) {
      return [];
    }

    return this.model;
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}


class RecentFile extends vscode.TreeItem {
  constructor(
    public readonly uri: vscode.Uri,
    public readonly fileName: string
  ) {
    super(fileName);

    this.resourceUri = uri;
    this.command = {
      command: 'vscode.open',
      title: 'Open',
      arguments: [this.uri]
    };
  }

  toJSON(): ISerializedFile {
    return {
      serializedUri: this.uri.toString(),
      fileName: this.fileName
    };
  }

  static fromJSON(serialized: ISerializedFile): RecentFile {
    return new RecentFile(vscode.Uri.parse(serialized.serializedUri), serialized.fileName);
  }
}
