"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, List, ListOrdered, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
}

function exec(command: string) {
  document.execCommand(command);
}

export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder = "Saisissez le contenu...",
  minHeightClassName = "min-h-[160px]",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="rounded-lg border">
        <div className="flex flex-wrap gap-1 border-b p-2">
          <Button type="button" size="icon" variant="ghost" onClick={() => exec("bold")}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => exec("italic")}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => exec("insertUnorderedList")}>
            <List className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => exec("insertOrderedList")}>
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => exec("formatBlock")}>
            <Type className="h-4 w-4" />
          </Button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          className={`prose prose-sm max-w-none px-4 py-3 focus:outline-none ${minHeightClassName} empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]`}
          onInput={(event) => onChange((event.target as HTMLDivElement).innerHTML)}
        />
      </div>
    </div>
  );
}
