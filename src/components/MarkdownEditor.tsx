import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { useEffect, useCallback, useRef } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Minus,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";

interface MarkdownEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  editable?: boolean;
}

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-muted/50 rounded-t-lg">
      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        aria-label="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 1 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        aria-label="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-label="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        aria-label="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <Toggle
        size="sm"
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Bullet List"
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <Toggle
        size="sm"
        pressed={editor.isActive("blockquote")}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label="Blockquote"
      >
        <Quote className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("codeBlock")}
        onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
        aria-label="Code Block"
      >
        <Code className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
        aria-label="Horizontal Rule"
      >
        <Minus className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <Toggle
        size="sm"
        pressed={editor.isActive("link")}
        onPressedChange={setLink}
        aria-label="Link"
      >
        <LinkIcon className="h-4 w-4" />
      </Toggle>
    </div>
  );
}

export function MarkdownEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  editable = true,
}: MarkdownEditorProps) {
  const isUpdatingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: !editable,
        HTMLAttributes: {
          class: "text-primary underline hover:text-primary/80 cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Markdown,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      if (isUpdatingRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markdown = (editor.storage as any).markdown.getMarkdown() as string;
      onChange(markdown);
    },
  });

  useEffect(() => {
    if (!editor) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentMarkdown = (editor.storage as any).markdown.getMarkdown() as string;
    if (content !== currentMarkdown) {
      isUpdatingRef.current = true;
      editor.commands.setContent(content || "");
      isUpdatingRef.current = false;
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  return (
    <div className="border rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-ring">
      {editable && <Toolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className={`
          prose prose-sm max-w-none
          [&_.tiptap]:outline-none [&_.tiptap]:min-h-[120px] [&_.tiptap]:px-3 [&_.tiptap]:py-2
          [&_.tiptap_p]:my-1 [&_.tiptap_h1]:text-xl [&_.tiptap_h1]:font-bold [&_.tiptap_h1]:my-2
          [&_.tiptap_h2]:text-lg [&_.tiptap_h2]:font-semibold [&_.tiptap_h2]:my-2
          [&_.tiptap_h3]:text-base [&_.tiptap_h3]:font-semibold [&_.tiptap_h3]:my-1.5
          [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ul]:my-1
          [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_ol]:my-1
          [&_.tiptap_li]:my-0.5
          [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-border [&_.tiptap_blockquote]:pl-3 [&_.tiptap_blockquote]:italic [&_.tiptap_blockquote]:text-muted-foreground [&_.tiptap_blockquote]:my-2
          [&_.tiptap_pre]:bg-muted [&_.tiptap_pre]:p-3 [&_.tiptap_pre]:rounded [&_.tiptap_pre]:my-2 [&_.tiptap_pre]:text-sm [&_.tiptap_pre]:font-mono
          [&_.tiptap_code]:bg-muted [&_.tiptap_code]:px-1 [&_.tiptap_code]:rounded [&_.tiptap_code]:text-sm [&_.tiptap_code]:font-mono
          [&_.tiptap_hr]:border-border [&_.tiptap_hr]:my-3
          [&_.tiptap_.is-editor-empty:first-child::before]:text-muted-foreground [&_.tiptap_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_.is-editor-empty:first-child::before]:float-left [&_.tiptap_.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_.is-editor-empty:first-child::before]:h-0
        `}
      />
    </div>
  );
}
