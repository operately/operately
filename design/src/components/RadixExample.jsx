import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';

const RadixDialogExample = () => {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="bg-content-accent hover:bg-link-hover text-surface-base font-bold py-2 px-4 rounded border border-surface-outline">
          Open Dialog
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-surface-dimmed bg-opacity-80" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-surface-base p-6 rounded-lg shadow-lg w-96 max-w-full border border-surface-outline">
          <Dialog.Title className="text-content-accent text-xl font-bold mb-2">Dialog Title</Dialog.Title>
          <Dialog.Description className="text-content-base mb-4">
            This is a Radix UI Dialog component integrated with Astro and styled with Tailwind CSS.
          </Dialog.Description>
          <div className="mt-4 flex justify-end">
            <Dialog.Close asChild>
              <button className="bg-surface-dimmed hover:bg-surface-highlight text-content-base font-bold py-2 px-4 rounded border border-surface-outline">
                Close
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default RadixDialogExample;
