import { MultipartFileUpoader } from "./FileUploader";

import { createBlobExtension } from "./createBlobExtension";
import { createDropFilePlugin } from "./createDropFilePlugin";
import { createPasteFilePlugin } from "./createPasteFilePlugin";

const uploader = new MultipartFileUpoader();
const dropFilePlugin = createDropFilePlugin(uploader);
const pasteFilePlugin = createPasteFilePlugin(uploader);

const BlobExtension = createBlobExtension([dropFilePlugin, pasteFilePlugin]);

export default BlobExtension;
