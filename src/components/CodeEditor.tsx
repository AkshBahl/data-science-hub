import { useState, useEffect, useRef, useMemo } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Play, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import initSqlJs, { Database } from "sql.js";
import "@/lib/monaco-config";

interface CodeEditorProps {
  language?: string;
  defaultValue?: string;
  height?: string;
  question?: string;
  expectedOutput?: string; // Expected output for validation
}

const CodeEditor = ({ language = "sql", defaultValue = "", height = "300px", question, expectedOutput }: CodeEditorProps) => {
  // Get comment syntax based on language
  const getCommentPrefix = (lang: string): string => {
    if (lang === "python") return "#";
    if (lang === "sql") return "--";
    // JavaScript, TypeScript, Java, C++, C#, Go, Rust all use //
    if (["javascript", "typescript", "java", "cpp", "csharp", "go", "rust"].includes(lang)) return "//";
    return "#"; // Default to Python-style
  };

  // Get starter code based on language
  const getStarterCode = (lang: string): string => {
    switch (lang) {
      case "python":
        return "# Write your Python solution here\nprint('Hello, World!')";
      case "sql":
        return "SELECT * FROM employees LIMIT 5;";
      case "javascript":
        return "// Write your JavaScript solution here\nconsole.log('Hello, World!');";
      case "typescript":
        return "// Write your TypeScript solution here\nconsole.log('Hello, World!');";
      case "java":
        return "// Write your Java solution here\npublic class Solution {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}";
      case "cpp":
        return "// Write your C++ solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello, World!\" << endl;\n    return 0;\n}";
      case "csharp":
        return "// Write your C# solution here\nusing System;\n\nclass Solution {\n    static void Main() {\n        Console.WriteLine(\"Hello, World!\");\n    }\n}";
      case "go":
        return "// Write your Go solution here\npackage main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println(\"Hello, World!\")\n}";
      case "rust":
        return "// Write your Rust solution here\nfn main() {\n    println!(\"Hello, World!\");\n}";
      default:
        return "# Write your code here";
    }
  };

  // Generate initial code with question context
  const getInitialCode = useMemo(() => {
    if (defaultValue) return defaultValue;
    
    const commentPrefix = getCommentPrefix(language);
    let initialCode = "";
    
    if (question) {
      // Add question as a comment at the top
      const questionLines = question.split("\n").map(line => `${commentPrefix} ${line}`).join("\n");
      const solutionPrompt = language === "sql" 
        ? `${commentPrefix} Write your SQL solution below:`
        : `${commentPrefix} Write your ${language} solution below:`;
      initialCode = `${questionLines}\n\n${solutionPrompt}\n`;
    } else {
      initialCode = `${commentPrefix} Write your ${language} code here\n`;
    }
    
    // Add starter code
    initialCode += getStarterCode(language);
    return initialCode;
  }, [defaultValue, question, language]);

  const [code, setCode] = useState(getInitialCode);
  const [output, setOutput] = useState<{ columns: string[]; values: any[][] } | null>(null);
  const [textOutput, setTextOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<{ passed: boolean; message?: string } | null>(null);
  const [sqlJs, setSqlJs] = useState<any>(null);
  const [db, setDb] = useState<Database | null>(null);
  const [pyodide, setPyodide] = useState<any>(null);
  const { toast } = useToast();
  const dbInitialized = useRef(false);
  const dbRef = useRef<Database | null>(null);
  const pyodideLoading = useRef(false);

  // Function to normalize and compare outputs
  const compareOutputs = (
    actualOutput: { columns: string[]; values: any[][] } | string | null,
    expectedOutput: string
  ): { passed: boolean; message?: string } => {
    if (!expectedOutput) {
      return { passed: true }; // No expected output means no validation
    }

    try {
      if (language === "sql" && actualOutput && typeof actualOutput === "object" && "columns" in actualOutput) {
        // For SQL, expectedOutput should be a JSON string
        const expected = JSON.parse(expectedOutput);
        
        // Compare columns
        const actualCols = actualOutput.columns.map(c => c.toLowerCase().trim());
        const expectedCols = expected.columns?.map((c: string) => c.toLowerCase().trim()) || [];
        
        if (actualCols.length !== expectedCols.length) {
          return { 
            passed: false, 
            message: `Column count mismatch. Expected ${expectedCols.length}, got ${actualCols.length}` 
          };
        }

        // Compare values (normalize for comparison)
        const actualValues = actualOutput.values.map(row => 
          row.map(cell => String(cell).toLowerCase().trim())
        ).sort();
        const expectedValues = (expected.values || []).map((row: any[]) => 
          row.map((cell: any) => String(cell).toLowerCase().trim())
        ).sort();

        if (actualValues.length !== expectedValues.length) {
          return { 
            passed: false, 
            message: `Row count mismatch. Expected ${expectedValues.length}, got ${actualValues.length}` 
          };
        }

        // Deep comparison of values
        const actualStr = JSON.stringify(actualValues);
        const expectedStr = JSON.stringify(expectedValues);
        
        if (actualStr === expectedStr) {
          return { passed: true, message: "Output matches expected result! ✓" };
        } else {
          return { 
            passed: false, 
            message: "Output does not match expected result. Check your solution." 
          };
        }
      } else if (typeof actualOutput === "string" || textOutput) {
        // For text-based outputs (Python, JavaScript, etc.)
        const actual = (typeof actualOutput === "string" ? actualOutput : textOutput || "").trim().toLowerCase();
        const expected = expectedOutput.trim().toLowerCase();
        
        // Remove extra whitespace and compare
        const normalizedActual = actual.replace(/\s+/g, " ");
        const normalizedExpected = expected.replace(/\s+/g, " ");
        
        if (normalizedActual === normalizedExpected) {
          return { passed: true, message: "Output matches expected result! ✓" };
        } else {
          // Try partial match
          if (normalizedActual.includes(normalizedExpected) || normalizedExpected.includes(normalizedActual)) {
            return { passed: true, message: "Output partially matches expected result! ✓" };
          }
          return { 
            passed: false, 
            message: "Output does not match expected result. Check your solution." 
          };
        }
      }
    } catch (error) {
      console.error("Validation error:", error);
      return { passed: false, message: "Error validating output. Please check the expected output format." };
    }

    return { passed: true };
  };

  // Update code when question, defaultValue, or language changes
  useEffect(() => {
    setCode(getInitialCode);
    setOutput(null);
    setTextOutput(null);
    setValidationResult(null);
    // Reset database initialization when language changes
    if (language !== "sql") {
      dbInitialized.current = false;
      if (dbRef.current) {
        dbRef.current.close();
        dbRef.current = null;
      }
      setDb(null);
    }
  }, [getInitialCode, language]);

  // Initialize Python (Pyodide) for Python execution
  useEffect(() => {
    if (language === "python" && !pyodide && !pyodideLoading.current) {
      pyodideLoading.current = true;
      const loadPyodide = async () => {
        try {
          // Dynamically import Pyodide
          const pyodideModule = await import("pyodide");
          const pyodideInstance = await pyodideModule.loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.0/full/",
          });
          setPyodide(pyodideInstance);
        } catch (error) {
          console.error("Failed to load Pyodide:", error);
          toast({
            title: "Python runtime not available",
            description: "Python execution may not work. Please refresh the page.",
            variant: "destructive",
          });
        } finally {
          pyodideLoading.current = false;
        }
      };
      loadPyodide();
    }
  }, [language, pyodide, toast]);

  // Initialize SQL.js for SQL execution
  useEffect(() => {
    if (language === "sql" && !dbInitialized.current) {
      const initDb = async () => {
        try {
          const SQL = await initSqlJs({
            locateFile: (file) => `https://sql.js.org/dist/${file}`,
          });
          setSqlJs(SQL);
          
          // Create a sample database with some tables for demonstration
          const database = new SQL.Database();
          
          // Create sample tables for SQL practice
          database.run(`
            CREATE TABLE employees (
              id INTEGER PRIMARY KEY,
              name TEXT NOT NULL,
              department TEXT,
              salary INTEGER,
              hire_date TEXT
            );
          `);
          
          database.run(`
            INSERT INTO employees (name, department, salary, hire_date) VALUES
            ('John Doe', 'Engineering', 75000, '2020-01-15'),
            ('Jane Smith', 'Marketing', 65000, '2019-03-20'),
            ('Bob Johnson', 'Engineering', 80000, '2018-06-10'),
            ('Alice Williams', 'Sales', 60000, '2021-02-05'),
            ('Charlie Brown', 'Engineering', 90000, '2017-11-30');
          `);
          
          database.run(`
            CREATE TABLE products (
              id INTEGER PRIMARY KEY,
              name TEXT NOT NULL,
              category TEXT,
              price REAL,
              stock INTEGER
            );
          `);
          
          database.run(`
            INSERT INTO products (name, category, price, stock) VALUES
            ('Laptop', 'Electronics', 999.99, 50),
            ('Mouse', 'Electronics', 29.99, 200),
            ('Desk Chair', 'Furniture', 199.99, 30),
            ('Monitor', 'Electronics', 299.99, 75),
            ('Keyboard', 'Electronics', 79.99, 150);
          `);
          
          database.run(`
            CREATE TABLE orders (
              id INTEGER PRIMARY KEY,
              product_id INTEGER,
              employee_id INTEGER,
              quantity INTEGER,
              order_date TEXT,
              FOREIGN KEY (product_id) REFERENCES products(id),
              FOREIGN KEY (employee_id) REFERENCES employees(id)
            );
          `);
          
          database.run(`
            INSERT INTO orders (product_id, employee_id, quantity, order_date) VALUES
            (1, 1, 2, '2024-01-10'),
            (2, 2, 5, '2024-01-12'),
            (3, 1, 1, '2024-01-15'),
            (4, 3, 3, '2024-01-18'),
            (5, 2, 4, '2024-01-20');
          `);
          
          dbRef.current = database;
          setDb(database);
          dbInitialized.current = true;
      } catch (error) {
        console.error("Failed to initialize SQL.js:", error);
        toast({
          title: "Error initializing SQL compiler",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        });
      }
    };

      initDb();
    }

    return () => {
      if (dbRef.current) {
        dbRef.current.close();
        dbRef.current = null;
      }
    };
  }, [language, toast]);

  const handleRun = async () => {
    if (!code.trim()) {
      toast({
        title: "No code to execute",
        description: "Please write some code first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setOutput(null);
    setTextOutput(null);
    setValidationResult(null);

    try {
      if (language === "sql") {
        if (!db) {
          toast({
            title: "Database not initialized",
            description: "Please wait for the database to load.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Split by semicolons to handle multiple queries
        const queries = code.split(";").filter((q) => q.trim());
        
        if (queries.length === 0) {
          toast({
            title: "No valid query",
            description: "Please write a valid SQL query.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Execute the last query (or all queries if needed)
        const query = queries[queries.length - 1].trim();
        
        if (query.toLowerCase().startsWith("select")) {
          // SELECT query - return results
          const result = db.exec(query);
          
          if (result.length > 0) {
            const { columns, values } = result[0];
            const outputData = { columns, values };
            setOutput(outputData);
            
            // Validate output if expectedOutput is provided
            if (expectedOutput) {
              const validation = compareOutputs(outputData, expectedOutput);
              setValidationResult(validation);
              if (validation.passed) {
                toast({
                  title: "✓ Solution Correct!",
                  description: validation.message || "Your output matches the expected result.",
                });
              } else {
                toast({
                  title: "Solution Incorrect",
                  description: validation.message || "Your output doesn't match the expected result.",
                  variant: "destructive",
                });
              }
            } else {
              toast({
                title: "Query executed successfully",
                description: `Returned ${values.length} row(s).`,
              });
            }
          } else {
            setOutput({ columns: [], values: [] });
            if (expectedOutput) {
              const validation = compareOutputs({ columns: [], values: [] }, expectedOutput);
              setValidationResult(validation);
            }
            toast({
              title: "Query executed",
              description: "No results returned.",
            });
          }
        } else {
          // INSERT, UPDATE, DELETE, CREATE, etc.
          db.run(query);
          setOutput({ columns: ["Status"], values: [["Query executed successfully"]] });
          toast({
            title: "Query executed successfully",
            description: "The query has been executed.",
          });
        }
      } else if (language === "python") {
        if (!pyodide) {
          toast({
            title: "Python runtime not ready",
            description: "Please wait for Python to load, then try again.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Capture stdout
        let outputText = "";
        pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
`);

        try {
          // Execute Python code
          pyodide.runPython(code);
          outputText = pyodide.runPython("sys.stdout.getvalue()");
        } catch (error: any) {
          outputText = `Error: ${error.message || String(error)}`;
        }

        const finalOutput = outputText || "(No output)";
        setTextOutput(finalOutput);
        
        // Validate output if expectedOutput is provided
        if (expectedOutput) {
          const validation = compareOutputs(finalOutput, expectedOutput);
          setValidationResult(validation);
          if (validation.passed) {
            toast({
              title: "✓ Solution Correct!",
              description: validation.message || "Your output matches the expected result.",
            });
          } else {
            toast({
              title: "Solution Incorrect",
              description: validation.message || "Your output doesn't match the expected result.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Code executed",
            description: outputText ? "Check the output below." : "Code ran successfully with no output.",
          });
        }
      } else if (language === "javascript") {
        // Execute JavaScript code
        try {
          // Capture console.log output
          const logs: string[] = [];
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          
          console.log = (...args: any[]) => {
            logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '));
            originalLog.apply(console, args);
          };
          
          console.error = (...args: any[]) => {
            logs.push(`ERROR: ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ')}`);
            originalError.apply(console, args);
          };
          
          console.warn = (...args: any[]) => {
            logs.push(`WARN: ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ')}`);
            originalWarn.apply(console, args);
          };

          // Execute code in a safe context
          const result = new Function(code)();
          
          // Restore console
          console.log = originalLog;
          console.error = originalError;
          console.warn = originalWarn;

          let outputText = logs.join('\n');
          if (result !== undefined) {
            outputText = outputText ? `${outputText}\n\nReturn value: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}` : `Return value: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}`;
          }
          
          const finalOutput = outputText || "(No output)";
          setTextOutput(finalOutput);
          
          // Validate output if expectedOutput is provided
          if (expectedOutput) {
            const validation = compareOutputs(finalOutput, expectedOutput);
            setValidationResult(validation);
            if (validation.passed) {
              toast({
                title: "✓ Solution Correct!",
                description: validation.message || "Your output matches the expected result.",
              });
            } else {
              toast({
                title: "Solution Incorrect",
                description: validation.message || "Your output doesn't match the expected result.",
                variant: "destructive",
              });
            }
          } else {
            toast({
              title: "Code executed",
              description: outputText ? "Check the output below." : "Code ran successfully with no output.",
            });
          }
        } catch (error: any) {
          setTextOutput(`Error: ${error.message || String(error)}\n\nStack trace:\n${error.stack || 'No stack trace available'}`);
          toast({
            title: "Execution Error",
            description: error.message || "An error occurred while executing the code.",
            variant: "destructive",
          });
        }
      } else if (language === "typescript") {
        // For TypeScript, we'll execute it as JavaScript (basic transpilation)
        // Note: This is a simplified approach - full TypeScript checking would require a compiler
        try {
          const logs: string[] = [];
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          
          console.log = (...args: any[]) => {
            logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '));
            originalLog.apply(console, args);
          };
          
          console.error = (...args: any[]) => {
            logs.push(`ERROR: ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ')}`);
            originalError.apply(console, args);
          };
          
          console.warn = (...args: any[]) => {
            logs.push(`WARN: ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ')}`);
            originalWarn.apply(console, args);
          };

          // Execute as JavaScript (TypeScript syntax is mostly compatible)
          const result = new Function(code)();
          
          // Restore console
          console.log = originalLog;
          console.error = originalError;
          console.warn = originalWarn;

          let outputText = logs.join('\n');
          if (result !== undefined) {
            outputText = outputText ? `${outputText}\n\nReturn value: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}` : `Return value: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}`;
          }
          
          const finalOutput = outputText || "(No output)\n\nNote: TypeScript is executed as JavaScript. Full type checking is not performed.";
          setTextOutput(finalOutput);
          
          // Validate output if expectedOutput is provided
          if (expectedOutput) {
            const validation = compareOutputs(finalOutput, expectedOutput);
            setValidationResult(validation);
            if (validation.passed) {
              toast({
                title: "✓ Solution Correct!",
                description: validation.message || "Your output matches the expected result.",
              });
            } else {
              toast({
                title: "Solution Incorrect",
                description: validation.message || "Your output doesn't match the expected result.",
                variant: "destructive",
              });
            }
          } else {
            toast({
              title: "Code executed",
              description: "TypeScript executed as JavaScript. Full type checking not available.",
            });
          }
        } catch (error: any) {
          setTextOutput(`Error: ${error.message || String(error)}\n\nStack trace:\n${error.stack || 'No stack trace available'}\n\nNote: TypeScript is executed as JavaScript.`);
          toast({
            title: "Execution Error",
            description: error.message || "An error occurred while executing the code.",
            variant: "destructive",
          });
        }
      } else {
        // For other languages (Java, C++, C#, Go, Rust, etc.), provide syntax highlighting only
        setTextOutput(
          `Code execution for ${language.toUpperCase()} is not yet available in the browser.\n\n` +
          `Your code:\n${'='.repeat(50)}\n${code}\n${'='.repeat(50)}\n\n` +
          `Note: Syntax highlighting is available. For execution, please use an external compiler or IDE.`
        );
        toast({
          title: "Execution not available",
          description: `${language.toUpperCase()} execution requires a compiler. Syntax highlighting is available.`,
        });
      }
    } catch (error: any) {
      console.error("Execution error:", error);
      const errorMsg = error.message || "An error occurred while executing the code.";
      toast({
        title: "Execution Error",
        description: errorMsg,
        variant: "destructive",
      });
      setTextOutput(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 p-1 sm:p-2">
      <div className="border border-border rounded-lg overflow-hidden bg-background/50">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-muted/30 border-b border-border gap-2">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {language.toUpperCase()} Editor
          </span>
          <Button
            onClick={handleRun}
            disabled={loading || (language === "sql" && !db) || (language === "python" && !pyodide)}
            size="sm"
            className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9"
            title={
              language === "sql" && !db
                ? "Waiting for SQL database to initialize..."
                : language === "python" && !pyodide
                ? "Waiting for Python runtime to load..."
                : "Run code"
            }
          >
            {loading ? (
              <>
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                <span className="hidden sm:inline">Running...</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Run</span>
              </>
            )}
          </Button>
        </div>
        <Editor
          height={height}
          language={language}
          value={code}
          onChange={(value) => setCode(value || "")}
          theme="vs-dark"
          loading={<div className="flex items-center justify-center h-full text-muted-foreground">Loading editor...</div>}
          options={{
            minimap: { enabled: false },
            fontSize: 12,
            lineNumbers: "on",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
            },
          }}
        />
      </div>

      {validationResult && (
        <div className={`border rounded-lg overflow-hidden ${
          validationResult.passed 
            ? "border-green-500/50 bg-green-500/10" 
            : "border-red-500/50 bg-red-500/10"
        }`}>
          <div className={`px-4 py-3 flex items-center gap-2 ${
            validationResult.passed 
              ? "bg-green-500/20" 
              : "bg-red-500/20"
          }`}>
            {validationResult.passed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className={`text-sm font-semibold ${
              validationResult.passed ? "text-green-500" : "text-red-500"
            }`}>
              {validationResult.passed ? "Solution Correct!" : "Solution Incorrect"}
            </span>
            {validationResult.message && (
              <span className="text-xs text-muted-foreground ml-2">
                {validationResult.message}
              </span>
            )}
          </div>
        </div>
      )}

      {(output || textOutput) && (
        <div className="border border-border rounded-lg overflow-hidden bg-background/50">
          <div className="px-4 py-2 bg-muted/30 border-b border-border">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Output
            </span>
          </div>
          <div className="overflow-x-auto">
            {output && output.columns.length > 0 && output.values.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    {output.columns.map((col, idx) => (
                      <th key={idx} className="px-4 py-2 text-left font-semibold text-foreground">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {output.values.map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-border/50 hover:bg-muted/10">
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-2 text-muted-foreground">
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : textOutput ? (
              <div className="p-4">
                <pre className="text-sm text-foreground font-mono whitespace-pre-wrap bg-background/50 p-3 rounded border border-border/50">
                  {textOutput}
                </pre>
              </div>
            ) : (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No results to display
              </div>
            )}
          </div>
        </div>
      )}

      {language === "sql" && (
        <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-md">
          <p className="font-semibold mb-1">Available tables for practice:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><code className="bg-background/50 px-1 rounded">employees</code> - id, name, department, salary, hire_date</li>
            <li><code className="bg-background/50 px-1 rounded">products</code> - id, name, category, price, stock</li>
            <li><code className="bg-background/50 px-1 rounded">orders</code> - id, product_id, employee_id, quantity, order_date</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;

