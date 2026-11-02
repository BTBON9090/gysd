<script setup lang="ts">
import { computed, watch, onBeforeUnmount } from 'vue'
import { ElButton, ElMessage, ElTooltip } from 'element-plus'
import { Bold, Italic, Underline, List, ListOrdered, ImagePlus, Undo2, Redo2 } from 'lucide-vue-next'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { productDetailTextLength, safeProductHtml } from './productRichHtml'

const model = defineModel<string>({ default: '' })
const textLength = computed(() => productDetailTextLength(model.value))
const editor = useEditor({
  content: safeProductHtml(model.value),
  extensions: [StarterKit.configure({ heading: false, blockquote: false, codeBlock: false, code: false, horizontalRule: false, link: false }), Image.configure({ allowBase64: true })],
  editorProps: { attributes: { 'aria-label': '商品详情', role: 'textbox', 'aria-multiline': 'true' } },
  onUpdate: ({ editor: current }) => { model.value = safeProductHtml(current.getHTML()) },
})
watch(model, value => {
  if (editor.value && safeProductHtml(editor.value.getHTML()) !== safeProductHtml(value)) editor.value.commands.setContent(safeProductHtml(value), { emitUpdate: false })
})
onBeforeUnmount(() => editor.value?.destroy())
function upload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 1024 * 1024) { ElMessage.warning('详情图片支持 JPG、PNG、WebP，单张不超过 1MB'); input.value = ''; return }
  if ((model.value.match(/data:image\//g) || []).length >= 2) { ElMessage.warning('详情最多插入 2 张图片，其他图片请添加到商品图片 / 视频'); input.value = ''; return }
  const reader = new FileReader()
  reader.onload = () => editor.value?.chain().focus().setImage({ src: String(reader.result), alt: '商品详情图片' }).run()
  reader.readAsDataURL(file)
  input.value = ''
}
</script>
<template>
  <div class="rich-editor">
    <div v-if="editor" class="toolbar" aria-label="编辑工具栏">
      <ElTooltip content="加粗"><ElButton text :type="editor.isActive('bold') ? 'primary' : 'default'" aria-label="加粗" @click="editor.chain().focus().toggleBold().run()"><Bold :size="16"/></ElButton></ElTooltip>
      <ElTooltip content="斜体"><ElButton text :type="editor.isActive('italic') ? 'primary' : 'default'" aria-label="斜体" @click="editor.chain().focus().toggleItalic().run()"><Italic :size="16"/></ElButton></ElTooltip>
      <ElTooltip content="下划线"><ElButton text :type="editor.isActive('underline') ? 'primary' : 'default'" aria-label="下划线" @click="editor.chain().focus().toggleUnderline().run()"><Underline :size="16"/></ElButton></ElTooltip>
      <span class="separator" />
      <ElTooltip content="无序列表"><ElButton text :type="editor.isActive('bulletList') ? 'primary' : 'default'" aria-label="无序列表" @click="editor.chain().focus().toggleBulletList().run()"><List :size="16"/></ElButton></ElTooltip>
      <ElTooltip content="有序列表"><ElButton text :type="editor.isActive('orderedList') ? 'primary' : 'default'" aria-label="有序列表" @click="editor.chain().focus().toggleOrderedList().run()"><ListOrdered :size="16"/></ElButton></ElTooltip>
      <ElTooltip content="插入图片"><label class="insert" title="插入图片"><ImagePlus :size="16"/><input type="file" aria-label="插入图片" accept="image/jpeg,image/png,image/webp" @change="upload" /></label></ElTooltip>
      <span class="separator" />
      <ElTooltip content="撤销"><ElButton text aria-label="撤销" :disabled="!editor.can().undo()" @click="editor.chain().focus().undo().run()"><Undo2 :size="16"/></ElButton></ElTooltip>
      <ElTooltip content="重做"><ElButton text aria-label="重做" :disabled="!editor.can().redo()" @click="editor.chain().focus().redo().run()"><Redo2 :size="16"/></ElButton></ElTooltip>
    </div>
    <EditorContent :editor="editor" class="content" />
    <div class="character-count" :class="{'is-over':textLength>5000}">{{textLength}} / 5000 <span v-if="textLength>5000">请将文字缩减至 5000 字以内</span></div>
  </div>
</template>
<style scoped>
.rich-editor{border:1px solid #dce4ef;border-radius:7px;overflow:hidden}.toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:2px;padding:6px 8px;background:#f8fafc;border-bottom:1px solid #e3eaf3}.toolbar :deep(.el-button){margin:0;width:32px;height:32px;padding:0}.separator{height:18px;width:1px;margin:0 5px;background:#dce4ef}.insert{position:relative;display:grid;place-items:center;width:32px;height:32px;border-radius:5px;color:#596a80;cursor:pointer;overflow:hidden}.insert:hover{background:#edf2fb;color:#315bc8}.insert input{position:absolute;inset:0;opacity:0;cursor:pointer}.content :deep(.tiptap){min-height:160px;padding:12px;outline:none;line-height:1.7;font-size:14px}.content :deep(.tiptap p){margin:0 0 .5em}.content :deep(.tiptap img){max-width:100%;height:auto}.character-count{padding:0 12px 9px;color:#8190a4;text-align:right;font-size:12px}.character-count.is-over{color:#c8443a}
</style>
