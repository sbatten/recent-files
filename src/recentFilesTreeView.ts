import * as vscode from 'vscode';
import * as path from 'path';

interface ISerializedFile {
  serializedUri: string;
  fileName: string;
}

export class RecentFilesProvider extends vscode.Disposable implements vscode.TreeDataProvider<RecentFile> {
  private model: RecentFile[] = [];
  private disposables: vscode.Disposable[] = [];
  private arraySize = 50;

  private _onDidChangeTreeData: vscode.EventEmitter<void | RecentFile | RecentFile[] | null | undefined> =
    new vscode.EventEmitter<void | RecentFile | RecentFile[] | null | undefined>();
  onDidChangeTreeData?: vscode.Event<void | RecentFile | RecentFile[] | null | undefined> | undefined =
    this._onDidChangeTreeData.event;

  constructor(private readonly context: vscode.ExtensionContext) {
    super(() => this.dispose());

    // fail safe check, if not array, set it to array.
    // if not array, will fail the rest of the functionality
    let check_is_array = context.workspaceState.get('recentFiles', []);
    if(!Array.isArray(check_is_array))
      this.context.workspaceState.update('recentFiles', []);

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
    // If file is NOT in array, add into array
    if (this.model.find((file) => file.uri.path === document.uri.path) === undefined) {
      this.model.splice(0, 0, new RecentFile(document.uri, path.basename(document.fileName)));
    }
    // else, rearrange the index to the beginning of array
    else {
      const matchingIndex = this.model.findIndex((file) => file.uri.path === document.uri.path);
      if (matchingIndex !== -1) {
        const removedFile = this.model.splice(matchingIndex, 1)[0];
        this.model.splice(0, 0, removedFile);
      }
    }

    this.context.workspaceState.update('recentFiles', this.model.map((file) => file.toJSON()));
    
    // Reduce the list if exceeds the maximum size
    while(this.model.length > this.arraySize)
      this.model.pop();
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