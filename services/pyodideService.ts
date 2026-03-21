
declare global {
  interface Window {
    loadPyodide: (config: any) => Promise<any>;
  }
}

let pyodideWorker: Worker | null = null;
let pendingRequests: Map<string, { resolve: (val: any) => void, reject: (err: any) => void }> = new Map();

const getWorker = () => {
  if (pyodideWorker) return pyodideWorker;

  console.log("Initializing Pyodide Worker...");
  pyodideWorker = new Worker(new URL('./pyodideWorker.ts', import.meta.url), { type: 'module' });

  pyodideWorker.onmessage = (event) => {
    const { id, result, error } = event.data;
    const request = pendingRequests.get(id);
    if (request) {
      if (error) request.reject(new Error(error));
      else request.resolve(result);
      pendingRequests.delete(id);
    }
  };

  pyodideWorker.onerror = (error) => {
    console.error("Pyodide Worker Error:", error);
  };

  return pyodideWorker;
};

const sendToWorker = (type: 'TRANSFORM' | 'ANALYZE', csvContent: string, pythonCode: string): Promise<string> => {
  const worker = getWorker();
  const id = Math.random().toString(36).substring(7);

  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    worker.postMessage({ type, csvContent, pythonCode, id });
  });
};

// Execute the transformation locally (Returns CSV)
export const runPythonTransformation = async (
  csvContent: string,
  pythonCode: string
): Promise<string> => {
  try {
    return await sendToWorker('TRANSFORM', csvContent, pythonCode);
  } catch (error) {
    console.error("Pyodide Execution Error:", error);
    throw new Error("Failed to execute Python code locally: " + String(error));
  }
};

// Execute analysis code locally (Returns captured Output/Print)
export const runPythonAnalysis = async (
  csvContent: string,
  pythonCode: string
): Promise<string> => {
  try {
    return await sendToWorker('ANALYZE', csvContent, pythonCode);
  } catch (error) {
    console.error("Pyodide Analysis Error:", error);
    return "Error executing code: " + String(error);
  }
};
