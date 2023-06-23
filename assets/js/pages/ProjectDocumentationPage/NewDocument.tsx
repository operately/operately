import React from "react";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";
import * as TipTapEditor from "@/components/Editor";

import * as Me from "@/graphql/Me";

import Avatar from "@/components/Avatar";
import Button from "@/components/Button";

export function NewDocument({ project, schema, onSubmit }) {
  const form = useDocumentForm(schema);

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${project.id}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>

        <Icons.IconSlash size={16} />

        <Paper.NavItem linkTo={`/projects/${project.id}/documentation`}>
          Documentation
        </Paper.NavItem>
      </Paper.Navigation>
      <Paper.Body>
        <NewDocumentTitle title={schema.title} subtitle={schema.subtitle} />

        <div className="flex flex-col gap-6 px-16 pb-8">
          {schema.content.map((item: any) => (
            <SchemaItem
              key={item.name}
              item={item}
              inputState={form.inputs[item.name]}
            />
          ))}
        </div>

        <div className="px-16">
          <div className="flex items-center gap-2 mb-8">
            <PostButton
              onClick={() => onSubmit(form.toJSON())}
              title={"Post " + schema.title}
              disabled={!form.isSubmitable()}
            />
            <CancelButton linkTo={`/projects/${project.id}/documentation`} />
          </div>
        </div>
      </Paper.Body>
    </Paper.Root>
  );
}

function SchemaItem({ item, inputState }) {
  switch (item.type) {
    case "richtext":
      return <RichTextEditor item={item} editor={inputState} />;
    case "question":
      return (
        <Question item={item} value={inputState[0]} setValue={inputState[1]} />
      );
    default:
      return null;
  }
}

function RichTextEditor({ item, editor }) {
  return (
    <div className="border-b border-shade-2">
      <div className="flex items-center gap-1 border-y border-shade-2 px-2 py-1 mt-8 -mx-2">
        <TipTapEditor.Toolbar editor={editor} />
      </div>
      <div
        className="mb-8 py-4 text-white-1 text-lg"
        style={{ minHeight: "300px" }}
      >
        <TipTapEditor.EditorContent editor={editor} />
      </div>
    </div>
  );
}

function NewDocumentTitle({ title, subtitle }) {
  const { data } = Me.useMe();

  return (
    <div className="p-16 pb-0">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <Avatar person={data.me} size="large" />
        </div>

        <div>
          <div className="text-2xl font-extrabold">{title}</div>
          <div>{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

type QuestionOption = {
  value: string;
  label: string;
};

function Question({ item, value, setValue }) {
  return (
    <div className="">
      <p className="font-semibold">{item.question}</p>

      <div className="flex items-center gap-4 mt-2">
        {item.options.map((option: QuestionOption) => (
          <div key={option.value} className="flex items-center gap-1">
            <input
              type="radio"
              name={item.name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => setValue(e.target.value)}
            />
            <label>{option.label}</label>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostButton({ onClick, title, disabled }) {
  return (
    <Button onClick={onClick} variant="success" disabled={disabled}>
      <Icons.IconMail size={20} />
      {title}
    </Button>
  );
}

function CancelButton({ linkTo }) {
  return (
    <Button variant="secondary" linkTo={linkTo}>
      Cancel
    </Button>
  );
}

function useDocumentForm(schema) {
  let form = {
    inputs: {},
    isSubmitable: () => false,
  };

  schema.content.forEach((item) => {
    form.inputs[item.name] = useDocumentFormInput(item);
  });

  form.isSubmitable = () => {
    return schema.content.every((item) => {
      if (item.type === "question") {
        return form.inputs[item.name][0] !== null;
      }

      if (item.type === "richtext") {
        if (form.inputs[item.name] === null) return false;

        let content = form.inputs[item.name].getJSON();
        if (content === null) return false;

        let docContent = content.content[0];
        if (!docContent) return false;

        return true;
      }
    });
  };

  form.toJSON = () => {
    let json = {};

    schema.content.forEach((item) => {
      if (item.type === "question") {
        json[item.name] = form.inputs[item.name][0];
      }

      if (item.type === "richtext") {
        json[item.name] = form.inputs[item.name].getJSON();
      }
    });

    return json;
  };

  return form;
}

function useDocumentFormInput(item) {
  switch (item.type) {
    case "richtext":
      return TipTapEditor.useEditor({ placeholder: item.placeholder });
    case "question":
      return useQuestionInput(item);
    default:
      return null;
  }
}

function useQuestionInput(item) {
  return React.useState(null);
}
