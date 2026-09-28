import { useTranslation } from "react-i18next";
import * as React from "react";
import { IconFile } from "../icons";

function ZeroNodes({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <div className="border border-dashed border-stroke-base p-4 w-[500px] mx-auto mt-12 flex gap-4">
      <IconFile size={48} className="text-gray-600" />
      <div>
        <div className="font-bold">{t("Ready for your first document")}</div>
        <br />
        <div>{message}</div>
      </div>
    </div>
  );
}

export function HubZeroNodes() {
  const { t } = useTranslation();
  return (
    <ZeroNodes
      message={t(
        "Your team's central hub for sharing documents, images, videos, and files. Click 'Add' to get started.",
      )}
    />
  );
}

export function FolderZeroNodes() {
  const { t } = useTranslation();
  return <ZeroNodes message={t("This folder is empty. Click 'Add' to upload your first file.")} />;
}
