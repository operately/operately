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

        <div className="flex flex-col gap-6 px-16 p-8">
          {schema.content.map((item: any) =>
            itemHandler(item.type).component({
              item,
              inputState: form.inputs[item.name],
            })
          )}
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

function itemHandler(type) {
  switch (type) {
    case "richtext":
      return RichText;
    case "yes_no_question":
      return YesNoQuestion;
    case "paragraph_question":
      return ParagraphQuestion;
    default:
      return NullItem;
  }
}

const NullItem = {
  inputState: () => {
    return null;
  },

  component: () => {
    return null;
  },

  isSubmitable: () => {
    return true;
  },

  toJSON: () => {
    return null;
  },
};

const RichText = {
  inputState: ({ item }) => {
    return TipTapEditor.useEditor({ placeholder: item.placeholder });
  },

  component: ({ inputState }) => {
    let editor = inputState;

    return (
      <div className="border-b border-shade-2">
        <div className="flex items-center gap-1 border-y border-shade-2 px-2 py-1 -mx-2">
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
  },

  isSubmitable: ({ inputState }) => {
    if (inputState === null) return false;

    let content = inputState.getJSON();
    if (content === null) return false;

    let docContent = content.content[0];
    if (!docContent) return false;

    return true;
  },

  toJSON: ({ inputState }) => {
    return inputState.getJSON();
  },
};

const ParagraphQuestion = {
  inputState: ({ item }) => {
    return TipTapEditor.useEditor({ placeholder: "Write your answer here..." });
  },

  component: ({ item, inputState }) => {
    let editor = inputState;

    return (
      <div className="">
        <label className="font-bold">{item.question}</label>

        <div className="bg-dark-3 border border-shade-2 rounded-lg mt-2 px-4">
          <div className="flex items-center gap-1 border-b border-shade-2 px-2 py-1 -mx-4">
            <TipTapEditor.Toolbar editor={editor} />
          </div>
          <div
            className="mb-8 py-4 text-white-1"
            style={{ minHeight: "100px" }}
          >
            <TipTapEditor.EditorContent editor={editor} />
          </div>
        </div>
      </div>
    );
  },

  isSubmitable: ({ inputState }) => {
    if (inputState === null) return false;

    let content = inputState.getJSON();
    if (content === null) return false;

    let docContent = content.content[0];
    if (!docContent) return false;

    return true;
  },

  toJSON: ({ inputState }) => {
    return inputState.getJSON();
  },
};

const YesNoQuestion = {
  inputState: () => {
    return React.useState(null);
  },

  component: ({ item, inputState }) => {
    const [value, setValue] = inputState;

    return (
      <div className="">
        <p className="font-semibold">{item.question}</p>

        <div className="flex items-center gap-4 mt-2">
          {item.options.map((option) => (
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
  },

  isSubmitable: ({ inputState }) => {
    const [value] = inputState;

    return value !== null;
  },

  toJSON: ({ item, inputState }) => {
    const [value] = inputState;

    return { [item.name]: value };
  },
};

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

function useDocumentForm(schema) {
  let form = {
    inputs: {},
    isSubmitable: () => false,
  };

  schema.content.forEach((item) => {
    form.inputs[item.name] = itemHandler(item.type).inputState({ item });
  });

  form.isSubmitable = () => {
    return schema.content.every((item) => {
      return itemHandler(item.type).isSubmitable({
        inputState: form.inputs[item.name],
      });
    });
  };

  form.toJSON = () => {
    let json = {};

    schema.content.forEach((item) => {
      json[item.name] = itemHandler(item.type).toJSON({
        item,
        inputState: form.inputs[item.name],
      });
    });

    return json;
  };

  return form;
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
