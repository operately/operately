import React from "react";
import { IconPlus, IconTrash } from "../../../icons";
import { SecondaryButton } from "../../../Button";

interface Props {
  display: boolean;
  isPending: boolean;
  onAddClick?: (e: React.MouseEvent) => void;
  onDeleteClick?: (e: React.MouseEvent) => void;
}

export function ActionButtons({ display, isPending, onAddClick, onDeleteClick }: Props) {
  return (
    <div className="absolute right-2 top-1/2 mt-0.5 transform -translate-y-1/2 z-10 flex items-center gap-2">
      {display && onAddClick && <AddButton onClick={onAddClick} />}
      {isPending && onDeleteClick && <DeleteButton onClick={onDeleteClick} />}
    </div>
  );
}

interface ButtonProps {
  onClick: (e: React.MouseEvent) => void;
}

function AddButton({ onClick }: ButtonProps) {
  return (
    <div className="rounded-2xl overflow-hidden">
      <SecondaryButton
        size="xxs"
        onClick={onClick}
        icon={IconPlus}
      >
        Add
      </SecondaryButton>
    </div>
  );
}

function DeleteButton({ onClick }: ButtonProps) {
  return (
    <div className="rounded-full overflow-hidden text-red-500 hover:text-red-600">
      <SecondaryButton
        size="xxs"
        onClick={onClick}
      >
        <IconTrash size={14} />
      </SecondaryButton>
    </div>
  );
}
