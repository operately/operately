defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.CompanyMembersPermissionsEdited do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      company_id: content["company_id"],
      members: Enum.map(content["members"], fn member ->
        Serializer.serialize(member, level: :essential)
      end)
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.CompanyMembersPermissionsEdited.Member do
  alias OperatelyWeb.Api.Serializer
  alias Operately.Access.Binding

  def serialize(member, level: :essential) do
    %{
      person_id: member["person_id"],
      person: Serializer.serialize(member["person"], level: :essential),
      previous_access_level: member["previous_access_level"],
      previous_access_level_label: Binding.label(member["previous_access_level"]),
      updated_access_level: member["updated_access_level"],
      updated_access_level_label: Binding.label(member["updated_access_level"])
    }
  end
end
