import * as vscode from "vscode";

// This function serializes all objects and arrays within the JSON, except the top-level object if it's an object.
function serializeAll(json: any, isTop: boolean = true): any {
  if (typeof json === "object" && json !== null) {
    if (Array.isArray(json)) {
      // Directly serialize arrays
      return JSON.stringify(json);
    } else if (!isTop) {
      // Serialize non-top-level objects
      return JSON.stringify(json);
    } else {
      // For top-level objects, serialize their properties if they are objects or arrays
      const serializedObject: { [key: string]: any } = {};
      Object.keys(json).forEach((key) => {
        serializedObject[key] = serializeAll(json[key], false);
      });
      return serializedObject;
    }
  }
  return json;
}

function beautifyJson(json: any): any {
  if (typeof json === "string") {
    try {
      const obj = JSON.parse(json);
      // Recursively beautify in case of nested serialized strings
      return beautifyJson(obj);
    } catch (error) {
      // Not a serialized JSON string, return as is
      return json;
    }
  } else if (Array.isArray(json) || typeof json === "object") {
    Object.keys(json).forEach((key) => {
      json[key] = beautifyJson(json[key]);
    });
  }
  return json;
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension.serializeJson",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const document = editor.document;
        let data: any;

        try {
          data = JSON.parse(document.getText());
        } catch (error) {
          vscode.window.showErrorMessage("Failed to parse JSON.");
          return;
        }

        // Serialize all objects and arrays within the JSON, except the top-level object if it's an object.
        const serializedData = serializeAll(data);

        // Convert the possibly modified top-level object back to a string
        const outputData = JSON.stringify(serializedData, null, 4);

        editor
          .edit((editBuilder) => {
            const entireRange = new vscode.Range(
              document.positionAt(0),
              document.positionAt(document.getText().length)
            );
            editBuilder.replace(entireRange, outputData);
          })
          .then((success) => {
            if (success) {
              vscode.window.showInformationMessage(
                "All objects and arrays serialized!"
              );
            } else {
              vscode.window.showErrorMessage("Serialization failed.");
            }
          });
      }
    }
  );

  let disposableUnserialize = vscode.commands.registerCommand(
    "extension.unserializeJson",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const document = editor.document;
        const documentText = document.getText();

        try {
          let data = JSON.parse(documentText);
          data = beautifyJson(data);
          const beautifiedData = JSON.stringify(data, null, 4);

          editor.edit((editBuilder) => {
            const entireRange = new vscode.Range(
              document.positionAt(0),
              document.positionAt(documentText.length)
            );
            editBuilder.replace(entireRange, beautifiedData);
          });
        } catch (error) {
          vscode.window.showErrorMessage("Failed to parse JSON.");
        }
      }
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(disposableUnserialize);
}
export function deactivate() {}
