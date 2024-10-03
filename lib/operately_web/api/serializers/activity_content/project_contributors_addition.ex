defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ProjectContributorsAddition do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      project: Serializer.serialize(content["project"], level: :essential),
      contributors: Enum.map(content["contributors"], fn contributor ->
        %{
          person: Serializer.serialize(contributor["person"], level: :essential),
          responsibility: contributor["responsibility"],
        }
      end)
    }
  end
end
