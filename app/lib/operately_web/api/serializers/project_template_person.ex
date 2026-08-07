defimpl OperatelyWeb.Api.Serializable, for: Operately.ProjectTemplates.Person do
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Paths
  alias Operately.ProjectTemplates.People

  def serialize(template_person, level: :essential) do
    %{
      id: Paths.project_template_person_id(template_person),
      person: Serializer.serialize(template_person.person),
      role: template_person.role,
      responsibility: template_person.responsibility,
      access_level: template_person.access_level,
      active: active?(template_person)
    }
  end

  def serialize(template_person, level: :full), do: serialize(template_person, level: :essential)

  defp active?(%{project_template: %{company_id: company_id}} = template_person), do: People.active?(template_person, company_id)
  defp active?(_template_person), do: false
end
