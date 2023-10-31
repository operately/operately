defmodule OperatelyWeb.Graphql.Types.ActivityContentProjectTimelineEdited do
  use Absinthe.Schema.Notation

  object :activity_content_project_timeline_edited do
    field :example_field, non_null(:string) do
      resolve fn _parent, _args, _resolution ->
        "Hello World"
      end
    end
  end
end
