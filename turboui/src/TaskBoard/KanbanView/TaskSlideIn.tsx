import React from "react";
import { SlideIn } from "../../SlideIn";
import { TaskPage } from "../../TaskPage";
import { TaskContent } from "../../TaskPage";
import { useWindowSizeBiggerOrEqualTo } from "../../utils/useWindowSizeBreakpoint";

interface TaskSlideInProps {
  isOpen: boolean;
  onClose: () => void;
  taskPageProps: TaskPage.ContentProps | null;
}

export function TaskSlideIn({
  isOpen,
  onClose,
  taskPageProps,
}: TaskSlideInProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const isLargeScreen = useWindowSizeBiggerOrEqualTo("sm");

  React.useEffect(() => {
    setIsDeleteModalOpen(false);
  }, [isOpen]);

  if (!taskPageProps) return null;

  const state: TaskPage.ContentState = {
    ...taskPageProps,
    isDeleteModalOpen,
    openDeleteModal: () => setIsDeleteModalOpen(true),
    closeDeleteModal: () => setIsDeleteModalOpen(false),
    useMinimalistDelete: true,
  };

  return (
    <SlideIn isOpen={isOpen} onClose={onClose} width={isLargeScreen ? "70%" : "100%"} testId="task-slide-in">
      <div className="pt-4 pb-20 px-6">
        <TaskContent {...state} />
      </div>
    </SlideIn>
  );
}

