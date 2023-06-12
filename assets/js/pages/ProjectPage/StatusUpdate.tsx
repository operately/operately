import React from "react";

import * as Icons from "tabler-icons-react";
import * as Dialog from "@radix-ui/react-dialog";

import Avatar, { AvatarSize } from "@/components/Avatar";

function StatusUpdatePreview(props) {
  const { person, acknowledged, title, message, comments, time } = props;

  return (
    <div className="flex items-center justify-between my-3">
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <Avatar person={person} />
        </div>

        <div className="">
          <div className="flex items-center justify-between font-bold">
            {title}
          </div>
          <div className="truncate max-w-[600px]">{message}</div>
        </div>
      </div>

      <div className="text-right w-32">{time}</div>
    </div>
  );
}
// <div className="mt-2 flex items-center gap-3">
//   <div className="flex items-center gap-1 font-medium">
//     {acknowledged ? (
//       <div className="flex items-center gap-1 text-green-400">
//         <Icons.CircleCheck size={14} className="text-green-400 " />{" "}
//         acknowledged
//       </div>
//     ) : (
//       <div className="flex items-center gap-1 text-yellow-400">
//         <Icons.Clock size={14} className="text-yellow-400" />
//         waiting
//       </div>
//     )}
//   </div>

//   <div className="flex items-center gap-1">
//     <Icons.MessageCircle size={14} /> {comments} comments
//   </div>
// </div>

export default function StatusUpdate({
  person,
  acknowledged,
  title,
  message,
  comments,
  time,
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <div>
          <StatusUpdatePreview
            {...{ person, acknowledged, title, message, comments, time }}
          />
        </div>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="bg-dark-1/80 backdrop-blur data-[state=open]:animate-overlayShow fixed inset-0" />
        <Dialog.Content className="bg-dark-2 border border-shade-2 fixed left-1/2 top-32 transform -translate-x-1/2 max-w-4xl w-full rounded-lg px-16 py-16 zoomOut">
          <Dialog.Title className="font-bold text-3xl">
            Status Update
          </Dialog.Title>

          <div className="flex items-center gap-2 my-4 w-full">
            <div>
              <Avatar person={person} size={AvatarSize.Small} />{" "}
            </div>
            <div className="font-medium">{person.fullName}</div>
            <div className="">&middot;</div>
            <div className="">{time}</div>
            <div className="">&middot;</div>
            {acknowledged ? (
              <div className="flex items-center gap-1 text-green-400">
                <Icons.CircleCheck size={14} className="text-green-400 " />{" "}
                acknowledged by John Smith
              </div>
            ) : (
              <div className="flex items-center gap-1 text-yellow-400">
                <Icons.Clock size={16} className="text-yellow-400" />
                waiting for acknowledgment from John Smith
              </div>
            )}
          </div>
          <Dialog.Description className="">
            <div className="mb-4 py-4 text-white-1 text-lg">{message}</div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-shade-3 rounded-full pl-2.5 p-1 gap-2">
                <Icons.ThumbUp size={22} />

                <div className="flex items-center gap-1">
                  <Avatar person={person} size={AvatarSize.Tiny} />
                  <Avatar person={person} size={AvatarSize.Tiny} />
                  <Avatar person={person} size={AvatarSize.Tiny} />
                </div>
              </div>

              <div className="flex items-center bg-shade-2 rounded-full pl-1 p-1 gap-2 cursor-pointer">
                <Icons.MoodSmile size={22} />
              </div>
            </div>
          </Dialog.Description>

          <Dialog.Close className="absolute top-8 right-8 flex items-center gap-2">
            <Icons.X size={24} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

StatusUpdate.defaultProps = {
  acknowledged: false,
};
