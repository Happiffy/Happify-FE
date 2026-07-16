import { forwardRef, useImperativeHandle } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { ListBullets, ListNumbers, TextAlignCenter, TextAlignJustify, TextAlignLeft, TextAlignRight, TextB, TextItalic } from '@phosphor-icons/react'

export type RichTextEditorHandle = {
  getHTML: () => string
  getText: () => string
  clear: () => void
}

type Props = {
  placeholder: string
  minHeight?: string
  onChange?: (html: string, text: string) => void
}

const toolbarButton = 'grid size-10 place-items-center rounded-xl text-[#777] transition hover:bg-[#F1FFE8] hover:text-[#46A302] disabled:opacity-40'
const activeButton = 'bg-[#F1FFE8] text-[#46A302]'

const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(function RichTextEditor({ placeholder, minHeight = 'min-h-24', onChange }, ref) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: `${minHeight} p-4 font-bold leading-7 text-[#3C3C3C] outline-none`,
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange?.(currentEditor.getHTML(), currentEditor.getText()),
  })

  useImperativeHandle(ref, () => ({
    getHTML: () => editor?.getHTML() ?? '',
    getText: () => editor?.getText().trim() ?? '',
    clear: () => editor?.commands.clearContent(),
  }), [editor])

  if (!editor) return null

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-[#E5E5E5] bg-white">
      <div className="flex flex-wrap gap-1 border-b-2 border-[#EFEFEF] bg-[#FBFBFB] p-2">
        <button className={`${toolbarButton} ${editor.isActive('bold') ? activeButton : ''}`} type="button" aria-label="Bold" onClick={() => editor.chain().focus().toggleBold().run()}><TextB size={20} weight="bold" /></button>
        <button className={`${toolbarButton} ${editor.isActive('italic') ? activeButton : ''}`} type="button" aria-label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}><TextItalic size={20} weight="bold" /></button>
        <button className={`${toolbarButton} ${editor.isActive('bulletList') ? activeButton : ''}`} type="button" aria-label="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()}><ListBullets size={20} weight="bold" /></button>
        <button className={`${toolbarButton} ${editor.isActive('orderedList') ? activeButton : ''}`} type="button" aria-label="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListNumbers size={20} weight="bold" /></button>
        <span className="mx-1 my-2 w-0.5 bg-[#E5E5E5]" />
        <button className={`${toolbarButton} ${editor.isActive({ textAlign: 'left' }) ? activeButton : ''}`} type="button" aria-label="Align left" onClick={() => editor.chain().focus().setTextAlign('left').run()}><TextAlignLeft size={20} weight="bold" /></button>
        <button className={`${toolbarButton} ${editor.isActive({ textAlign: 'center' }) ? activeButton : ''}`} type="button" aria-label="Align center" onClick={() => editor.chain().focus().setTextAlign('center').run()}><TextAlignCenter size={20} weight="bold" /></button>
        <button className={`${toolbarButton} ${editor.isActive({ textAlign: 'right' }) ? activeButton : ''}`} type="button" aria-label="Align right" onClick={() => editor.chain().focus().setTextAlign('right').run()}><TextAlignRight size={20} weight="bold" /></button>
        <button className={`${toolbarButton} ${editor.isActive({ textAlign: 'justify' }) ? activeButton : ''}`} type="button" aria-label="Justify" onClick={() => editor.chain().focus().setTextAlign('justify').run()}><TextAlignJustify size={20} weight="bold" /></button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
})

export default RichTextEditor
