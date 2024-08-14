defmodule OperatelyWeb.Api.Mutations.CreateProject do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_edit_access: 2, forbidden_or_not_found: 2]

  inputs do
    field :space_id, :string
    field :name, :string
    field :champion_id, :string
    field :reviewer_id, :string
    field :visibility, :string
    field :creator_is_contributor, :string
    field :creator_role, :string
    field :goal_id, :string
    field :anonymous_access_level, :integer
    field :company_access_level, :integer
    field :space_access_level, :integer
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    person = me(conn)
    company = company(conn)

    {:ok, goal_id} = decode_id(inputs[:goal_id], :allow_nil)
    {:ok, space_id} = decode_id(inputs[:space_id], :allow_nil)
    {:ok, champion_id} = decode_id(inputs[:champion_id], :allow_nil)
    {:ok, reviewer_id} = decode_id(inputs[:reviewer_id], :allow_nil)

    args = %Operately.Operations.ProjectCreation{
      name: inputs.name,
      champion_id: champion_id,
      reviewer_id: reviewer_id,
      creator_is_contributor: inputs[:creator_is_contributor],
      creator_role: inputs[:creator_role],
      visibility: inputs.visibility,
      creator_id: person.id,
      company_id: person.company_id,
      group_id: space_id,
      goal_id: goal_id,
      anonymous_access_level: inputs.anonymous_access_level,
      company_access_level: inputs.company_access_level,
      space_access_level: inputs.space_access_level,
    }

    if has_permissions?(person, company, space_id) do
      {:ok, project} = Operately.Projects.create_project(args)
      {:ok, %{project: Serializer.serialize(project, level: :essential)}}
    else
      query(company, space_id)
      |> forbidden_or_not_found(person.id)
    end
  end

  defp has_permissions?(person, company, space_id) do
    query(company, space_id)
    |> filter_by_edit_access(person.id)
    |> Repo.exists?()
  end

  defp query(company, space_id) when company.company_space_id != space_id do
    from(s in Operately.Groups.Group, where: s.id == ^space_id)
  end

  defp query(company, space_id) when company.company_space_id == space_id do
    from(c in Operately.Companies.Company, where: c.id == ^company.id)
  end
end
