import React from "react";
import Icon from "../../components/Icon";
import RichContent from "../../components/RichContent";

function DescriptionTitle() {
  return (
    <div className="flex items-center gap-[9px]">
      <Icon name="description" size="small" color="brand" />
      <div
        className="uppercase text-dark-base"
        style={{
          fontSize: "12.5px",
          lineHeight: "20px",
          letterSpacing: "0.03em",
        }}
      >
        Description
      </div>
    </div>
  );
}

function Description({ data }) {
  return (
    <div className="border-b border-dark-8% pb-[22px]">
      <DescriptionTitle />

      <div className="mt-[10px] pr-[62px]">
        <RichContent jsonContent={data.project.description} />
      </div>
    </div>
  );
}

export default function Overview({ data }) {
  return (
    <div className="mt-[26px]">
      <Description data={data} />
    </div>
  );
}
