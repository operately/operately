import React from "react";

import * as Icons from "tabler-icons-react";
import * as Dialog from "@radix-ui/react-dialog";

function Button(props) {
  return (
    <button className="text-pink-400 font-bold uppercase border border-pink-400 rounded-full hover:border-white-2 text-white-1 hover:text-white-1 px-3 py-1.5 text-sm flex items-center gap-2">
      <Icons.Message2 size={20} />
      Post Update
    </button>
  );
}

export default function PostUpdate() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-dark-1/80 backdrop-blur data-[state=open]:animate-overlayShow fixed inset-0" />
        <Dialog.Content className="bg-dark-2 border border-shade-2 fixed left-1/2 top-32 transform -translate-x-1/2 max-w-4xl w-full rounded-lg px-16 py-16 zoomOut">
          <div className="uppercase text-white-1 tracking-wide w-full mb-2">
            STATUS UPDATE
          </div>
          <Dialog.Title className="font-bold text-3xl">
            What's new since the previous update?
          </Dialog.Title>
          <Dialog.Description className="">
            <div className="flex items-center gap-2 border-y border-shade-2 py-2 mt-8">
              <Icons.Bold size={20} className="text-white-1" />
              <Icons.Italic size={20} className="text-white-1" />
              <Icons.Link size={20} className="text-white-1" />
              <Icons.Link size={20} className="text-white-1" />
              <Icons.ListNumbers size={20} className="text-white-1" />
              <Icons.ListCheck size={20} className="text-white-1" />
            </div>

            <div className="mb-8 py-8 text-white-2 text-lg">
              Write your update here...
            </div>

            <div className="flex items-center gap-2">
              <button className="border border-white-3 rounded-full bg-green-400/10 hover:border-white-2 text-white-2 hover:text-white-1 px-3 py-1.5 text-sm font-medium flex items-center gap-2 text-green-400 border-green-400">
                Post Update
              </button>

              <Dialog.Close asChild>
                <button className="border border-shade-3 rounded-full hover:border-white-2 text-white-2 hover:text-white-1 px-3 py-1.5 text-sm font-medium flex items-center gap-2">
                  Cancel
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Description>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
