
// pyodideWorker.ts
// This worker handles Pyodide execution to keep the main thread responsive.

// @ts-ignore
import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.mjs";

let pyodide: any = null;

async function init() {
  if (pyodide) return pyodide;
  
  pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
  });
  
  await pyodide.loadPackage("pandas");
  return pyodide;
}

self.onmessage = async (event) => {
  const { type, csvContent, pythonCode, id } = event.data;
  
  try {
    const py = await init();
    
    if (type === 'TRANSFORM') {
      py.globals.set("csv_raw_content", csvContent);
      
      const setupScript = `
import pandas as pd
import io

# Read CSV string into DataFrame with automatic delimiter detection
df = pd.read_csv(io.StringIO(csv_raw_content), sep=None, engine='python')
`;
      await py.runPythonAsync(setupScript);
      await py.runPythonAsync(pythonCode);
      
      const resultCsv = await py.runPythonAsync("df.to_csv(index=False)");
      self.postMessage({ id, result: resultCsv });
      
    } else if (type === 'ANALYZE') {
      py.globals.set("csv_raw_content", csvContent);
      
      const setupScript = `
import pandas as pd
import io
import sys

# Configure Pandas
pd.set_option('display.max_rows', 100)
pd.set_option('display.max_columns', 50)
pd.set_option('display.width', 1000)
pd.set_option('display.max_colwidth', 100)

class CatchOut:
    def __init__(self):
        self.value = ''
    def write(self, txt):
        self.value += txt

old_stdout = sys.stdout
sys.stdout = catch_out = CatchOut()

df = pd.read_csv(io.StringIO(csv_raw_content), sep=None, engine='python')
`;
      await py.runPythonAsync(setupScript);
      await py.runPythonAsync(pythonCode);
      
      const output = await py.runPythonAsync(`
sys.stdout = old_stdout
catch_out.value
`);
      self.postMessage({ id, result: output || "Code executed successfully (No output printed)." });
    }
  } catch (error) {
    self.postMessage({ id, error: String(error) });
  }
};
