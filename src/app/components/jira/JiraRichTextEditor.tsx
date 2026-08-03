import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Code,
  Undo,
  Redo,
  MoreHorizontal,
  Type,
  Palette,
  Paperclip,
  AtSign,
  Smile,
  Eye,
  Edit3
} from "lucide-react";
import { useState, useRef } from "react";
import { JiraButton } from "./JiraButton";
import { JiraTooltip } from "./JiraTooltip";
import { Card } from "../ui/card";

interface JiraRichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  toolbar?: "basic" | "full" | "minimal";
  height?: string;
  readOnly?: boolean;
  showPreview?: boolean;
}

export function JiraRichTextEditor({
  value = "",
  onChange,
  placeholder = "Start typing...",
  toolbar = "full",
  height = "300px",
  readOnly = false,
  showPreview = false
}: JiraRichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [content, setContent] = useState(value);
  const [selectedFormat, setSelectedFormat] = useState<string[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onChange?.(newContent);
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertText = (text: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const toolbarConfig = {
    minimal: [
      { icon: Bold, command: "bold", tooltip: "Bold (⌘B)" },
      { icon: Italic, command: "italic", tooltip: "Italic (⌘I)" },
      { icon: Link, command: "createLink", tooltip: "Add Link" },
    ],
    basic: [
      { icon: Bold, command: "bold", tooltip: "Bold (⌘B)" },
      { icon: Italic, command: "italic", tooltip: "Italic (⌘I)" },
      { icon: Underline, command: "underline", tooltip: "Underline (⌘U)" },
      { icon: List, command: "insertUnorderedList", tooltip: "Bullet List" },
      { icon: ListOrdered, command: "insertOrderedList", tooltip: "Numbered List" },
      { icon: Link, command: "createLink", tooltip: "Add Link" },
    ],
    full: [
      { icon: Bold, command: "bold", tooltip: "Bold (⌘B)" },
      { icon: Italic, command: "italic", tooltip: "Italic (⌘I)" },
      { icon: Underline, command: "underline", tooltip: "Underline (⌘U)" },
      { icon: Strikethrough, command: "strikeThrough", tooltip: "Strikethrough" },
      { type: "separator" },
      { icon: AlignLeft, command: "justifyLeft", tooltip: "Align Left" },
      { icon: AlignCenter, command: "justifyCenter", tooltip: "Align Center" },
      { icon: AlignRight, command: "justifyRight", tooltip: "Align Right" },
      { type: "separator" },
      { icon: List, command: "insertUnorderedList", tooltip: "Bullet List" },
      { icon: ListOrdered, command: "insertOrderedList", tooltip: "Numbered List" },
      { icon: Quote, command: "formatBlock", value: "blockquote", tooltip: "Quote" },
      { type: "separator" },
      { icon: Link, command: "createLink", tooltip: "Add Link" },
      { icon: Image, command: "insertImage", tooltip: "Insert Image" },
      { icon: Code, command: "formatBlock", value: "pre", tooltip: "Code Block" },
      { type: "separator" },
      { icon: Undo, command: "undo", tooltip: "Undo (⌘Z)" },
      { icon: Redo, command: "redo", tooltip: "Redo (⌘⇧Z)" },
    ]
  };

  const currentToolbar = toolbarConfig[toolbar];

  return (
    <Card className="overflow-hidden">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center justify-between p-3 border-b border-[#dfe1e6] bg-[#f4f5f7]">
          <div className="flex items-center space-x-1">
            {currentToolbar.map((tool, index) => {
              if (tool.type === "separator") {
                return (
                  <div key={index} className="w-px h-6 bg-[#dfe1e6] mx-2" />
                );
              }

              return (
                <JiraTooltip key={index} content={tool.tooltip}>
                  <button
                    onClick={() => {
                      if (tool.command === "createLink") {
                        const url = prompt("Enter URL:");
                        if (url) execCommand(tool.command, url);
                      } else if (tool.command === "insertImage") {
                        const url = prompt("Enter image URL:");
                        if (url) execCommand(tool.command, url);
                      } else {
                        execCommand(tool.command, tool.value);
                      }
                    }}
                    className="p-2 hover:bg-[#e4e6ea] rounded transition-colors"
                  >
                    <tool.icon className="w-4 h-4 text-[#5e6c84]" />
                  </button>
                </JiraTooltip>
              );
            })}
          </div>

          <div className="flex items-center space-x-2">
            {showPreview && (
              <JiraTooltip content={isPreview ? "Edit" : "Preview"}>
                <button
                  onClick={() => setIsPreview(!isPreview)}
                  className={`
                    p-2 rounded transition-colors
                    ${isPreview 
                      ? 'bg-[#deebff] text-[#0052cc]' 
                      : 'hover:bg-[#e4e6ea] text-[#5e6c84]'
                    }
                  `}
                >
                  {isPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </JiraTooltip>
            )}
            
            <JiraTooltip content="Mention someone">
              <button
                onClick={() => insertText("@")}
                className="p-2 hover:bg-[#e4e6ea] rounded transition-colors"
              >
                <AtSign className="w-4 h-4 text-[#5e6c84]" />
              </button>
            </JiraTooltip>
            
            <JiraTooltip content="Add emoji">
              <button className="p-2 hover:bg-[#e4e6ea] rounded transition-colors">
                <Smile className="w-4 h-4 text-[#5e6c84]" />
              </button>
            </JiraTooltip>
            
            <JiraTooltip content="Attach file">
              <button className="p-2 hover:bg-[#e4e6ea] rounded transition-colors">
                <Paperclip className="w-4 h-4 text-[#5e6c84]" />
              </button>
            </JiraTooltip>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="relative">
        {isPreview ? (
          <div 
            className="p-4 prose prose-sm max-w-none"
            style={{ minHeight: height }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable={!readOnly}
            className={`
              p-4 outline-none focus:ring-2 focus:ring-[#0052cc]/20 transition-all
              ${readOnly ? 'bg-[#f4f5f7] cursor-not-allowed' : 'bg-white'}
            `}
            style={{ minHeight: height }}
            placeholder={placeholder}
            onInput={(e) => handleContentChange(e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}

        {/* Character Count */}
        <div className="absolute bottom-2 right-2 text-xs text-[#5e6c84] bg-white/80 px-2 py-1 rounded">
          {String(content || '').replace(/<[^>]*>/g, '').length} characters
        </div>
      </div>

      {/* Footer Actions */}
      {!readOnly && (
        <div className="flex items-center justify-between p-3 border-t border-[#dfe1e6] bg-[#fafbfc]">
          <div className="flex items-center space-x-2 text-sm text-[#5e6c84]">
            <Type className="w-4 h-4" />
            <span>Rich text editor</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <JiraButton variant="subtle" size="sm">
              Cancel
            </JiraButton>
            <JiraButton variant="primary" size="sm">
              Save
            </JiraButton>
          </div>
        </div>
      )}
    </Card>
  );
}

// Comment editor variant
export function JiraCommentEditor({ onSubmit }: { onSubmit?: (content: string) => void }) {
  const [content, setContent] = useState("");

  return (
    <div className="space-y-3">
      <JiraRichTextEditor
        value={content}
        onChange={setContent}
        placeholder="Add a comment..."
        toolbar="basic"
        height="120px"
      />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-[#5e6c84]">
          <span>Pro tip: Use @ to mention someone</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <JiraButton variant="subtle" size="sm">
            Cancel
          </JiraButton>
          <JiraButton 
            variant="primary" 
            size="sm"
            onClick={() => onSubmit?.(content)}
            disabled={!String(content || '').trim()}
          >
            Comment
          </JiraButton>
        </div>
      </div>
    </div>
  );
}