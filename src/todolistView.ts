import {workspace, TreeDataProvider, TreeItem, EventEmitter, Event, ProviderResult, WorkspaceFolder, TreeItemCollapsibleState,ThemeIcon} from "vscode";
import {existsSync, readFileSync, writeFileSync} from "fs";
import { join } from "path";

const TODO_FILE = "todoclist.json";

export class TodoCListView implements TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: EventEmitter<TreeItem | undefined> = new EventEmitter<TreeItem | undefined>();
    readonly onDidChangeTreeData: Event<TreeItem | undefined> = this._onDidChangeTreeData.event;

    constructor(){
        workspace.onDidChangeTextDocument(event => {
            if(event.document.fileName.endsWith("todoclist.json")) this.refresh();
        });
    }

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }
    
    getTreeItem(element: TreeItem): TreeItem {
        return element;
    }

    getChildren(parent?: TreeItem): ProviderResult<TreeItem[]> {
        if(!workspace.workspaceFolders){
            return [];
        }

        if(!parent){
            return workspace.workspaceFolders.filter((folder) => existsSync(join(folder.uri.fsPath, TODO_FILE))).map((folder) => new Project(folder));
        }

        if(parent instanceof Project){
            return parent.getTaskItems();
        }

        return [];
    }
}

interface JsonProject {
    tasks: JsonTask[];
}

interface JsonTask {
    name: string;
    creation: number;
    completed?: number;
}


export class Project extends TreeItem {
    contextValue = "project";

    private todoPath: string;
    readonly name: string;

    constructor(private folder: WorkspaceFolder) {
        super(folder.name, TreeItemCollapsibleState.Collapsed);
        this.name = folder.name;
        this.todoPath = join(folder.uri.fsPath, TODO_FILE);
    }

    public getTaskItems(): Task[] {
        const json = this.readJSON();
        if(json){
            let tasks = [];
            for(let i = 0; i < json.tasks.length; i++){
                const task = json.tasks[i];
                if(!task.completed){
                    tasks.push(new Task(this, i, task));
                }
            }
            return tasks;
        }
        return [];
    }

    public readJSON(): JsonProject | undefined {
        return existsSync(this.todoPath) ? JSON.parse(readFileSync(this.todoPath, "utf-8")) : undefined;
    }

    public writeJSON(json: JsonProject): void {
        if(existsSync(this.todoPath)){
            writeFileSync(this.todoPath, JSON.stringify(json), {encoding: "utf-8"});
        }
    }

    public complete(index: number): void {
        const json = this.readJSON();
        if(json){
            json.tasks[index].completed = Math.floor(Date.now()/1000);
            this.writeJSON(json);
        }
    }

    public delete(index: number): void {
        const json = this.readJSON();
        if(json){
            json.tasks.splice(index, 1);
            this.writeJSON(json);
        }
    }

    public add(name: string): void {
        const json = this.readJSON();
        if(json){
            const task: JsonTask = {
                name:     name,
                creation: Math.floor(Date.now()/1000)
            }
            json.tasks.push(task);
            this.writeJSON(json);
        }
	}

    iconPath = new ThemeIcon("checklist");
}

export class Task extends TreeItem {
    contextValue = "task";

    constructor(public project: Project, public index: number, public jsonTask: JsonTask) {
        super("#"+(index+1)+": "+jsonTask.name, TreeItemCollapsibleState.None);
    }

    public complete(): void {
        this.project.complete(this.index);
    }

    public delete(): void {
        this.project.delete(this.index);
    }

    iconPath = new ThemeIcon("issues");
}