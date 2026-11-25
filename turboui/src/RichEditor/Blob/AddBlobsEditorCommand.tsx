import { getNodeType } from "@tiptap/core";
import { Fragment, Slice, type Node, type NodeType } from "@tiptap/pm/model";
import { Selection, type Transaction } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { UploadFileFn } from "../useEditor";
import { isInsideTable } from "../extensions/Table";

export function AddBlobsEditorCommand({
  files,
  pos,
  view,
  uploadFile,
  continueInParagraph = false,
}: {
  files: File[] | FileList;
  pos: number;
  view: EditorView;
  uploadFile: UploadFileFn;
  continueInParagraph?: boolean;
}) {
  if (!view.editable || files.length === 0) return false;
  if (isInsideTable(view.state.doc.resolve(pos))) return false;

  const blobType = getNodeType("blob", view.state.schema);
  const attachments = Array.from(files, (file) => ({ file, node: createPlaceholder(blobType, file) }));
  const placeholders = attachments.map(({ node }) => node);
  const transaction = view.state.tr;
  if (continueInParagraph) {
    insertWithFollowingParagraph(transaction, pos, placeholders);
  } else {
    transaction.insert(pos, placeholders);
  }
  if (!transaction.docChanged) return false;

  view.dispatch(transaction);
  for (const { file, node } of attachments) {
    void uploadAttachment(file, node.attrs.id, view, uploadFile);
  }

  return true;
}

function insertWithFollowingParagraph(transaction: Transaction, pos: number, placeholders: Node[]) {
  const paragraph = getNodeType("paragraph", transaction.doc.type.schema);
  const content = Fragment.fromArray([paragraph.create(null, placeholders), paragraph.create()]);

  // Open both ends so text before the insertion stays with the files and text after it joins the new paragraph.
  transaction.replaceRange(pos, pos, new Slice(content, 1, 1));
  const afterInsertion = transaction.doc.resolve(transaction.mapping.map(pos));
  transaction.setSelection(Selection.near(afterInsertion, -1));
}

async function uploadAttachment(file: File, placeholderId: string, view: EditorView, uploadFile: UploadFileFn) {
  try {
    const { id, url } = await uploadFile(file, (progress) => {
      updateNodeAttrs(placeholderId, { progress }, view);
    });
    updateNodeAttrs(placeholderId, { id, src: url, status: "uploaded" }, view);
  } catch {
    deleteNode(placeholderId, view);
  }
}

function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function createPlaceholder(blobType: NodeType, file: File) {
  return blobType.create({
    id: generateUniqueId(),
    src: URL.createObjectURL(file),
    title: file.name,
    alt: file.name,
    status: "uploading",
    filetype: file.type,
    filesize: file.size,
  });
}

function updateNodeAttrs(id: string, attrs: Record<string, unknown>, view: EditorView) {
  if (view.isDestroyed) return;
  const pos = findBlobPosition(id, view.state.doc);
  if (pos === undefined) return;

  const transaction = view.state.tr;
  for (const [name, value] of Object.entries(attrs)) {
    transaction.setNodeAttribute(pos, name, value);
  }
  view.dispatch(transaction);
}

function deleteNode(id: string, view: EditorView) {
  if (view.isDestroyed) return;
  const pos = findBlobPosition(id, view.state.doc);
  if (pos === undefined) return;

  view.dispatch(view.state.tr.delete(pos, pos + 1));
}

function findBlobPosition(id: string, doc: Node) {
  let position: number | undefined;
  doc.descendants((node, pos) => {
    if (node.type.name === "blob" && node.attrs.id === id) position = pos;
    return position === undefined;
  });
  return position;
}
