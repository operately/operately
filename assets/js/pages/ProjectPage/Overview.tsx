import React from "react";
import Icon from "../../components/Icon";
import RichContent from "../../components/RichContent";
import { ChevronUp, ChevronDown } from "./Icons";

function SectionTitle({ title, icon, iconSize = "small" }) {
  return (
    <div className="flex items-center gap-[9px] mt-[24px]">
      <Icon name={icon} size={iconSize} color="brand" />
      <div
        className="uppercase text-dark-base text-sm"
        style={{
          letterSpacing: "0.03em",
        }}
      >
        {title}
      </div>
    </div>
  );
}

function Grid3({ children }) {
  return <div className="grid grid-cols-3 gap-[22px]">{children}</div>;
}

const KpisTitle = () => (
  <SectionTitle title="Influences KPIs" icon="KPIs" iconSize="base" />
);

const DescriptionTitle = () => (
  <SectionTitle title="Description" icon="description" />
);

const KeyResourcesTitle = () => (
  <SectionTitle title="Key Resources" icon="attachment" iconSize="base" />
);

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

function KPIBox({ children }) {
  return (
    <div
      className="h-[136px] border border-dark-8% rounded-lg mt-[9px] cursor-pointer"
      style={{
        padding: "10px 10px 10px 20px",
      }}
    >
      {children}
    </div>
  );
}

function KeyResourceBox({ children }) {
  return (
    <div
      className="h-[44px] border border-dark-8% rounded-lg mt-[9px] cursor-pointer"
      style={{
        padding: "10px 10px 10px 20px",
      }}
    >
      {children}
    </div>
  );
}

function AddKpi() {
  return (
    <KPIBox>
      <div className="flex items-center justify-center gap-[4px] h-full -ml-[7px]">
        <Icon name="plus" size="small" color="brand" />
        <span className="text-sm font-bold text-brand-1 mt-[4px]">Add KPI</span>
      </div>
    </KPIBox>
  );
}

function KPI({ name, current, change, status }) {
  const color = status === "good" ? "text-success-1" : "text-danger-base";
  const chevron = status === "good" ? <ChevronUp /> : <ChevronDown />;

  return (
    <KPIBox>
      <div className="flex justify-between items-start h-full">
        <div className="flex flex-col justify-between h-full">
          <div className="flex flex-col gap-[4px] h-full">
            <div className="text-sm font-medium w-[127px] text-black">
              {name}
            </div>
            <div
              className={"font-bold " + color}
              style={{ fontSize: "21.6px", lineHeight: "32px" }}
            >
              {current}
            </div>
          </div>

          <div className="text-sm flex items-center -mb-[2px] gap-[5px]">
            Last month:
            <span className="flex items-center">
              {chevron} <span className={color + " font-medium"}>{change}</span>
            </span>
          </div>
        </div>

        <div>
          <Icon name="menu dots" size="small" color="dark-2" />
        </div>
      </div>
    </KPIBox>
  );
}

function Kpis({ data }) {
  return (
    <div className="border-b border-dark-8% pb-[24px]">
      <KpisTitle />

      <Grid3>
        <KPI
          name="Monthly Recurring Revenue"
          current="$ 700"
          change="$23k"
          status="good"
        />
        <KPI
          name="Net Promoter Score"
          current="4.4"
          change="0.1"
          status="bad"
        />
        <AddKpi />
      </Grid3>
    </div>
  );
}

function AddKeyResource() {
  return (
    <KeyResourceBox>
      <div className="flex items-center justify-center gap-[4px] h-full -ml-[7px]">
        <Icon name="plus" size="small" color="brand" />
        <span className="text-sm font-bold text-brand-1 mt-[4px]">
          Add Resource
        </span>
      </div>
    </KeyResourceBox>
  );
}

function KeyResource({ name, icon }) {
  return (
    <KeyResourceBox>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Icon name={icon} size="base" color="brand" />
          <span
            className="text-base font-bold text-brand-1 underline ml-[3px]"
            style={{
              textUnderlineOffset: "3px",
            }}
          >
            {name}
          </span>
        </div>

        <div>
          <Icon name="menu dots" size="small" color="dark-2" />
        </div>
      </div>
    </KeyResourceBox>
  );
}

function KeyResources({ data }) {
  return (
    <div className="pb-[22px]">
      <KeyResourcesTitle />

      <div className="mt-[10px]">
        <Grid3>
          <KeyResource name="Slack" icon="slack" />
          <KeyResource name="GitHub" icon="git" />

          <AddKeyResource />
        </Grid3>
      </div>
    </div>
  );
}

export default function Overview({ data }) {
  return (
    <div className="mt-[26px]">
      <Description data={data} />
      <Kpis data={data} />
      <KeyResources data={data} />
    </div>
  );
}
