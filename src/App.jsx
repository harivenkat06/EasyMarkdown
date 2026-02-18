import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const textareaRef = useRef(null);

  const undoStack = useRef([]);
  const redoStack = useRef([]);

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "";
  }, [darkMode]);

  // Save undo history
  const saveHistory = () => {
    undoStack.current.push(text);
    if (undoStack.current.length > 100) undoStack.current.shift();
    redoStack.current = [];
  };

  const handleUndo = () => {
    if (!undoStack.current.length) return;
    redoStack.current.push(text);
    setText(undoStack.current.pop());
  };

  const handleRedo = () => {
    if (!redoStack.current.length) return;
    undoStack.current.push(text);
    setText(redoStack.current.pop());
  };

  const wrapSelection = (before, after = before) => {
    saveHistory();
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = text.slice(start, end);
    const newText =
      text.slice(0, start) + before + selected + after + text.slice(end);
    setText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selected.length;
    }, 0);
  };

  const insertAtLineStart = (prefix) => {
    saveHistory();
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lines = text.split("\n");

    let charCount = 0;
    const newLines = lines.map((line) => {
      const lineStart = charCount;
      const lineEnd = charCount + line.length;

      if (start <= lineEnd && end >= lineStart) {
        line = prefix + line;
      }
      charCount += line.length + 1;
      return line;
    });

    setText(newLines.join("\n"));
  };

  const handleKeyDown = (e) => {
    const ctrl = e.ctrlKey || e.metaKey;

    // Single key Ctrl shortcuts
    if (ctrl && !e.shiftKey) {
      switch (e.key.toLowerCase()) {
        case "b": e.preventDefault(); wrapSelection("**"); break; // Bold
        case "i": e.preventDefault(); wrapSelection("*"); break;   // Italic
        case "1": e.preventDefault(); insertAtLineStart("# "); break; // H1
        case "2": e.preventDefault(); insertAtLineStart("## "); break; // H2
        case "3": e.preventDefault(); insertAtLineStart("### "); break; // H3
        case "p": e.preventDefault(); insertAtLineStart("- "); break; // Bullet
        case "q": e.preventDefault(); insertAtLineStart("> "); break; // Blockquote
        case "k": e.preventDefault(); wrapSelection("`"); break; // Inline code
        case "l": e.preventDefault(); { // Link
          const url = prompt("Enter URL:");
          if (url) wrapSelection("[", `](${url})`);
        } break;
        case "z": e.preventDefault(); handleUndo(); break; // Undo
        case "y": e.preventDefault(); handleRedo(); break; // Redo
      }
    }

    // Shift+Ctrl shortcuts
    if (ctrl && e.shiftKey) {
      switch (e.key.toLowerCase()) {
        case "c": e.preventDefault(); wrapSelection("\n```bash\n", "\n```\n"); break; // Code block
        case "t": e.preventDefault(); insertAtLineStart("- [ ] "); break; // Task list
        case "s": e.preventDefault(); wrapSelection("~~"); break; // Strikethrough
        case "i": e.preventDefault(); { // Image
          const imgUrl = prompt("Enter image URL:");
          if (imgUrl) wrapSelection("![](", `)`);
        } break;
        case "h": e.preventDefault(); insertAtLineStart("---\n"); break; // Horizontal rule
        case "g": e.preventDefault(); { // Table
          const cols = parseInt(prompt("Columns?", "3"));
          const rows = parseInt(prompt("Rows?", "2"));
          if (cols > 0 && rows > 0) {
            let table = "| ";
            for (let c = 0; c < cols; c++) table += `Header ${c + 1} | `;
            table += "\n| ";
            for (let c = 0; c < cols; c++) table += "---- | ";
            table += "\n";
            for (let r = 0; r < rows; r++) {
              table += "| ";
              for (let c = 0; c < cols; c++) table += "Data | ";
              table += "\n";
            }
            wrapSelection(table, "");
          }
        } break;
      }
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "README.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`app ${darkMode ? "dark" : ""}`}>
      {/* Header */}
      <div className="header">
        <h1>Markdown Pro Editor</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div className="shortcuts">
            <span className="shortcut">Ctrl+B Bold</span>
            <span className="shortcut">Ctrl+I Italic</span>
            <span className="shortcut">Ctrl+1 H1</span>
            <span className="shortcut">Ctrl+2 H2</span>
            <span className="shortcut">Ctrl+3 H3</span>
            <span className="shortcut">Ctrl+P Bullet</span>
            <span className="shortcut">Ctrl+Q Blockquote</span>
            <span className="shortcut">Ctrl+K Inline Code</span>
            <span className="shortcut">Shift+Ctrl+C Code Block</span>
            <span className="shortcut">Shift+Ctrl+T Task List</span>
            <span className="shortcut">Shift+Ctrl+S Strikethrough</span>
            <span className="shortcut">Shift+Ctrl+I Image</span>
            <span className="shortcut">Shift+Ctrl+H Horizontal Rule</span>
            <span className="shortcut">Ctrl+Shift+G Table</span>
            <span className="shortcut">Ctrl+Z Undo</span>
            <span className="shortcut">Ctrl+Y Redo</span>
          </div>
          <button onClick={downloadMarkdown}>Download README.md</button>
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <button onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? "Hide Preview" : "Preview"}
          </button>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="container">
        <div className="panel">
          <div className="panel-title">Editor</div>
          <textarea
            ref={textareaRef}
            className="editor"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start typing your README..."
          />
        </div>

        {showPreview && (
          <div className="panel">
            <div className="panel-title">Preview</div>
            <div className="preview-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {text}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
