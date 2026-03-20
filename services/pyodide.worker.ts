/// <reference lib="webworker" />

declare function loadPyodide(config: { indexURL: string }): Promise<any>;

importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodide: any = null;

onmessage = async (event: MessageEvent) => {
  const { type, csvContent, pythonCode } = event.data;

  if (type === "init") {
    try {
      pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
      });
      await pyodide.loadPackage("pandas");
      postMessage({ type: "ready" });
    } catch (error) {
      postMessage({ type: "error", error: String(error) });
    }
  }

  if (type === "transform" || type === "analyze") {
    if (!pyodide) {
      postMessage({ type: "error", error: "Pyodide not initialized" });
      return;
    }
    try {
      pyodide.globals.set("csv_raw_content", csvContent);
      const result = await pyodide.runPythonAsync(pythonCode);
      postMessage({ type: "result", result: result ?? "" });
    } catch (error) {
      postMessage({ type: "error", error: String(error) });
    }
  }
};