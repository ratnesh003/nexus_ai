// pyodideService.ts
const worker = new Worker(
  new URL("./pyodide.worker.ts", import.meta.url),
  { type: "classic" } // 👈 must match — classic workers use importScripts
);

let isReady = false;
let readyPromise: Promise<void> | null = null;

// Initialize Pyodide via Worker
export const initPyodide = (): Promise<void> => {
  if (isReady) return Promise.resolve();
  if (readyPromise) return readyPromise;

  readyPromise = new Promise<void>((resolve, reject) => {
    worker.postMessage({ type: "init" });
    worker.onmessage = (e) => {
      if (e.data.type === "ready") {
        isReady = true;
        resolve();
      } else if (e.data.type === "error") {
        reject(new Error(e.data.error));
      }
    };
  });

  return readyPromise;
};

// Helper: Send a job to the worker and wait for the response
const runInWorker = (
  type: "transform" | "analyze",
  csvContent: string,
  pythonCode: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    worker.onmessage = (e) => {
      if (e.data.type === "result") resolve(e.data.result);
      else if (e.data.type === "error") reject(new Error(e.data.error));
    };
    worker.postMessage({ type, csvContent, pythonCode });
  });
};

// Execute the transformation (Returns CSV)
export const runPythonTransformation = async (
  csvContent: string,
  pythonCode: string
): Promise<string> => {
  await initPyodide();

  const setupScript = `
import pandas as pd
import io

df = pd.read_csv(io.StringIO(csv_raw_content))
csv_data = csv_raw_content
`;

  const resultScript = `
df.to_csv(index=False)
`;

  const fullCode = setupScript + "\n" + pythonCode + "\n" + resultScript;

  try {
    return await runInWorker("transform", csvContent, fullCode);
  } catch (error) {
    throw new Error("Failed to execute Python code: " + String(error));
  }
};

// Execute analysis code (Returns captured print output)
export const runPythonAnalysis = async (
  csvContent: string,
  pythonCode: string
): Promise<string> => {
  await initPyodide();

  const fullCode = `
import pandas as pd
import io
import sys

pd.set_option('display.max_rows', 100)
pd.set_option('display.max_columns', 50)
pd.set_option('display.width', 1000)
pd.set_option('display.max_colwidth', 100)

class CatchOut:
    def __init__(self):
        self.value = ''
    def write(self, txt):
        self.value += txt
    def flush(self):
        pass

old_stdout = sys.stdout
sys.stdout = catch_out = CatchOut()

df = pd.read_csv(io.StringIO(csv_raw_content))
csv_data = csv_raw_content

${pythonCode}

sys.stdout = old_stdout
catch_out.value
`;

  try {
    const output = await runInWorker("analyze", csvContent, fullCode);
    return output || "Code executed successfully (No output printed).";
  } catch (error) {
    return "Error executing code: " + String(error);
  }
};