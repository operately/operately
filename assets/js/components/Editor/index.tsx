import React from "react";

import * as TipTap from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Dropcursor from "@tiptap/extension-dropcursor";

import Toolbar from "./Toolbar";
import MentionPopup from "./MentionPopup";
import Button from "@/components/Button";

import axios from "axios";

export type EditorMentionSearchFunc = ({ query }: { query: string }) => Promise<Person[]>;

interface Person {
  id: string;
  fullName: string;
}

interface OnSaveData {
  json: any;
  html: string;
}

interface OnBlurData {
  json: any;
  html: string;
}

interface UseEditorProps {
  peopleSearch?: EditorMentionSearchFunc;
  placeholder?: string;
  content?: any;
  onSave?: (data: OnSaveData) => void;
  onBlur?: (data: OnBlurData) => void;
}

export interface Context {
  linkEditActive: boolean;
  setLinkEditActive: (active: boolean) => void;
}

export const EditorContext = React.createContext<Context | null>(null);

export function Root({ children }): JSX.Element {
  const [linkEditActive, setLinkEditActive] = React.useState(false);

  return <EditorContext.Provider value={{ linkEditActive, setLinkEditActive }}>{children}</EditorContext.Provider>;
}

function uploadImage(file) {
  const data = new FormData();
  data.append("file", file);

  let req = axios.create();
  let token = document.querySelector("meta[name='csrf-token']").getAttribute("content");

  req.defaults.headers.common["Content-Type"] = "multipart/form-data";
  req.defaults.headers.common["x-csrf-token"] = token;

  return req.post("/blobs", data);
}

function useEditor(props: UseEditorProps): TipTap.Editor | null {
  const [_submitActive, setSubmitActive] = React.useState(false);

  return TipTap.useEditor({
    content: props.content,
    autofocus: true,
    injectCSS: false,
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          // if dropping external files
          let file = event.dataTransfer.files[0]; // the dropped file
          let filesize = (file.size / 1024 / 1024).toFixed(4); // get the filesize in MB
          if ((file.type === "image/jpeg" || file.type === "image/png") && filesize < 10) {
            // check valid image type under 10MB
            // check the dimensions
            let _URL = window.URL || window.webkitURL;
            let img = new window.Image(); /* global Image */
            img.src = _URL.createObjectURL(file);
            img.onload = function () {
              if (this.width > 5000 || this.height > 5000) {
                window.alert("Your images need to be less than 5000 pixels in height and width."); // display alert
              } else {
                // valid image so upload to server
                // uploadImage will be your function to upload the image to the server or s3 bucket somewhere
                uploadImage(file)
                  .then(function (response) {
                    const path = response.data.path;

                    const { schema } = view.state;
                    const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                    const node = schema.nodes.image.create({ src: path }); // creates the image element
                    const transaction = view.state.tr.insert(coordinates.pos, node); // places it in the correct position
                    return view.dispatch(transaction);
                  })
                  .catch(function (error) {
                    if (error) {
                      window.alert("There was a problem uploading your image, please try again.");
                    }
                  });
              }
            };
          } else {
            window.alert("Images need to be in jpg or png format and less than 10mb in size.");
          }
          return true; // handled
        }
        return false; // not handled use default behaviour
      },
    },
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Dropcursor,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: props.placeholder,
      }),
      Mention.configure({
        suggestion: {
          render: () => new MentionPopup(),
          items: props.peopleSearch,
        },
      }),
    ],
    onBlur: ({ editor }) => {
      if (!props.onBlur) return;

      props.onBlur({
        json: editor.getJSON(),
        html: editor.getHTML(),
      });
    },
    onUpdate: ({ editor }) => {
      setSubmitActive(editor.state.doc.textContent.length > 0);
    },
  });
}

const EditorContent = TipTap.EditorContent;

export function LinkEditForm({ editor }): JSX.Element {
  const { linkEditActive, setLinkEditActive } = React.useContext(EditorContext) as Context;
  const [link, setLink] = React.useState(editor?.getAttributes("link")?.href || "");

  const unlink = React.useCallback(() => {
    editor.chain().focus().unsetLink().run();
    setLinkEditActive(false);
  }, [editor]);

  const save = React.useCallback(() => {
    editor.chain().focus().setLink({ href: link }).run();
    setLinkEditActive(false);
  }, [editor, link]);

  if (!editor) return <></>;
  if (!editor.isActive("link")) return <></>;
  if (!linkEditActive) return <></>;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-24 bg-dark-2 border-t border-shade-3">
      <div className="p-4 flex flex-col gap-1 w-full h-full">
        <label className="text-sm font-bold">Link URL:</label>

        <div className="flex items-center gap-2">
          <input
            autoFocus
            type="text"
            className="flex-1 px-2 py-1 border border-indigo-400 rounded-lg text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 text-white-1"
            value={link}
            placeholder="ex. https://example.com"
            onChange={(e) => setLink(e.target.value)}
          />

          <Button onClick={save} variant="success" size="small">
            Save
          </Button>

          <Button onClick={unlink} variant="secondary" size="small">
            Unlink
          </Button>
        </div>
      </div>
    </div>
  );
}

export { useEditor, EditorContent, Toolbar };
