
declare global {
  interface Window {
    loadPyodide: (config: any) => Promise<any>;
  }
}

let pyodideInstance: any = null;

// Initialize Pyodide and load Pandas
export const initPyodide = async () => {
  if (pyodideInstance) return pyodideInstance;

  console.log("Initializing Pyodide...");
  if (!window.loadPyodide) {
    throw new Error("Pyodide script not loaded in index.html");
  }

  pyodideInstance = await window.loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
  });

  console.log("Loading Pandas...");
  await pyodideInstance.loadPackage("pandas");
  console.log("Pyodide Ready.");
  return pyodideInstance;
};

// Execute the transformation locally
export const runPythonTransformation = async (
  csvContent: string,
  pythonCode: string
): Promise<string> => {
  const py = await initPyodide();

  try {
    // 1. Pass the CSV content to Python
    py.globals.set("csv_raw_content", csvContent);

    // 2. Setup script: Import pandas, read CSV into 'df'
    // We also define 'csv_data' as an alias because LLMs often assume this variable name exists
    const setupScript = `
import pandas as pd
import io

# Read CSV string into DataFrame
df = pd.read_csv(io.StringIO(csv_raw_content))
csv_data = csv_raw_content
`;
    await py.runPythonAsync(setupScript);

    // 3. Run the user's generated transformation code
    // The code expects 'df' to exist and should modify 'df'
    await py.runPythonAsync(pythonCode);

    // 4. Extract result: Convert 'df' back to CSV string
    const resultScript = `
df.to_csv(index=False)
`;
    const resultCsv = await py.runPythonAsync(resultScript);
    
    return resultCsv;

  } catch (error) {
    console.error("Pyodide Execution Error:", error);
    throw new Error("Failed to execute Python code locally: " + String(error));
  }
};
