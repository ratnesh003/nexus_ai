
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

// Execute the transformation locally (Returns CSV)
export const runPythonTransformation = async (
  csvContent: string,
  pythonCode: string
): Promise<string> => {
  const py = await initPyodide();

  try {
    // 1. Pass the CSV content to Python
    py.globals.set("csv_raw_content", csvContent);

    // 2. Setup script: Import pandas, read CSV into 'df'
    const setupScript = `
import pandas as pd
import io

# Read CSV string into DataFrame
df = pd.read_csv(io.StringIO(csv_raw_content))
csv_data = csv_raw_content
`;
    await py.runPythonAsync(setupScript);

    // 3. Run the user's generated transformation code
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

// Execute analysis code locally (Returns captured Output/Print)
export const runPythonAnalysis = async (
  csvContent: string,
  pythonCode: string
): Promise<string> => {
  const py = await initPyodide();

  try {
    py.globals.set("csv_raw_content", csvContent);

    // Setup: Redirect stdout to capture print() statements AND set display options
    const setupScript = `
import pandas as pd
import io
import sys

# Configure Pandas to show more data (prevent truncation)
pd.set_option('display.max_rows', 100)
pd.set_option('display.max_columns', 50)
pd.set_option('display.width', 1000)
pd.set_option('display.max_colwidth', 100)

# Create a class to capture stdout
class CatchOut:
    def __init__(self):
        self.value = ''
    def write(self, txt):
        self.value += txt

# Save original stdout
old_stdout = sys.stdout
# Redirect stdout
sys.stdout = catch_out = CatchOut()

# Load Data
df = pd.read_csv(io.StringIO(csv_raw_content))
csv_data = csv_raw_content
`;
    await py.runPythonAsync(setupScript);

    // Run the analysis code
    await py.runPythonAsync(pythonCode);

    // Retrieve the captured output
    const getOutputScript = `
sys.stdout = old_stdout # Restore stdout
catch_out.value
`;
    const output = await py.runPythonAsync(getOutputScript);

    return output || "Code executed successfully (No output printed).";

  } catch (error) {
    // Attempt to restore stdout even if error
    try { py.runPython("sys.stdout = old_stdout"); } catch(e){} 
    
    console.error("Pyodide Analysis Error:", error);
    return "Error executing code: " + String(error);
  }
};
