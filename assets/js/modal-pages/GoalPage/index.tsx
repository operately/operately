import * as React from "react";

import Modal from "@/components/PageModal";
import { Header, Overview, Targets, Messages, RelatedWork, GoalFeed } from "@/pages/GoalPageV4/components";
import { useLoadedData } from "./loader";
import { Paths } from "@/routes/paths";

interface Props {
  goalId: string;
  isOpen: boolean;
  setShowPage: React.Dispatch<React.SetStateAction<boolean>>;
}

export function GoalPageModal({ goalId, isOpen, setShowPage }: Props) {
  const { data, loading } = useLoadedData(goalId);

  if (!data?.goal || loading) return <></>;

  const path = Paths.goalPath(data.goal.id!);

  return (
    <Modal isOpen={isOpen} size="xl" hideModal={() => setShowPage(false)} path={path}>
      <Header goal={data.goal} hideOptions />
      <Overview />
      <Targets />
      <Messages />
      <RelatedWork />
      <GoalFeed goal={data.goal} />
    </Modal>
  );
}
