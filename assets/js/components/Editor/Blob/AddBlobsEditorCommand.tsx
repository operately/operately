import { FileUploader, MultipartFileUpoader } from "./FileUploader";

export function AddBlobsEditorCommand({ files, pos, view }: { files: File[] | FileList; pos: number; view: any }) {
  if (!view.editable) return false;

  Array.from(files).forEach(async (file) => {
    handleUpload(file, view, pos, new MultipartFileUpoader());
  });

  return true;
}

async function handleUpload(file: File, view: any, pos: any, uploader: FileUploader) {
  const id = generateUniqueId();

  // Step 1: Add a placeholder node before uploading the file.
  createNode(id, file, view, pos);

  // Step 2: Start the upload process and hook up progress updates.
  const path = await uploader.upload(file, (progress) => {
    updateNodeAttrs(id, { progress: progress }, view);
  });

  // Step 3: Update the node with the final path.
  updateNodeAttrs(id, { src: path, status: "uploaded" }, view);
}

function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function createNode(id: string, file: File, view: any, pos: any) {
  const { schema } = view.state;
  const blobSchema = schema.nodes.blob;

  let node = blobSchema.create({
    id: id,
    src: URL.createObjectURL(file),
    title: file.name,
    alt: file.name,
    status: "uploading",
    filetype: file.type,
    filesize: file.size,
  });

  const transaction = view.state.tr.insert(pos, node);
  view.dispatch(transaction);
}

function updateNodeAttrs(id: string, attrs: any, view: any) {
  const n = findNode(id, view.state.doc);
  if (!n.node) return;
  if (!n.pos) return;

  const transaction = view.state.tr;

  Object.keys(attrs).forEach((key) => {
    transaction.setNodeAttribute(n.pos, key, attrs[key]);
  });

  view.dispatch(transaction);
}

function findNode(id: string, doc: any) {
  var result = { node: null, pos: null };

  doc.descendants((node: any, pos: any) => {
    if (node.attrs.id === id) {
      result.node = node;
      result.pos = pos;

      return false; // stop searching
    }
  });

  return result;
}
