defmodule OperatelyWeb.Api.ProjectTemplates.List do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Ecto.Query, only: [from: 2]

  alias Operately.Access.Filters
  alias Operately.ProjectTemplates
  alias Operately.ProjectTemplates.{Milestone, People, ProjectTemplate, Task}
  alias Operately.Repo

  inputs do
    field? :space_id, :id, null: true
    field? :search, :string, null: false, default: ""
    field? :archive_status, :project_template_archive_status, null: false, default: "active"
  end

  outputs do
    field :templates, list_of(:project_template), null: false
  end

  def call(conn, inputs) do
    with {:ok, :enabled} <- ProjectTemplates.ensure_feature_enabled(company(conn)) do
      templates = list_project_templates(me(conn), inputs)

      {:ok, %{templates: Serializer.serialize(templates, level: :essential)}}
    end
  end

  defp list_project_templates(requester, filters) do
    ProjectTemplate
    |> from(as: :template)
    |> where_company(requester.company_id)
    |> Filters.filter_by_view_access(requester.id, join_parent: :space, named_binding: :template)
    |> where_space(filters[:space_id])
    |> where_search(filters[:search])
    |> where_archive_status(filters[:archive_status] || :active)
    |> order_and_preload()
    |> Repo.all()
    |> put_child_counts()
    |> People.put_inactive_summaries()
    |> Enum.sort_by(fn template -> {template.space.name, template.name, template.id} end)
  end

  defp where_company(query, company_id) do
    from([template: template] in query, where: template.company_id == ^company_id)
  end

  defp where_space(query, nil), do: query

  defp where_space(query, space_id) do
    from([template: template] in query, where: template.space_id == ^space_id)
  end

  defp where_search(query, search) when search in [nil, ""], do: query

  defp where_search(query, search) do
    search = String.trim(search)

    if search == "" do
      query
    else
      pattern = "%#{search}%"

      from([template: template] in query,
        where: ilike(template.name, ^pattern) or fragment("CAST(? AS TEXT) ILIKE ?", template.description, ^pattern)
      )
    end
  end

  defp where_archive_status(query, :active) do
    from([template: template] in query, where: is_nil(template.archived_at))
  end

  defp where_archive_status(query, :archived) do
    from([template: template] in query, where: not is_nil(template.archived_at))
  end

  defp where_archive_status(query, :all), do: query

  defp order_and_preload(query) do
    from([template: template] in query,
      order_by: [asc: template.name, asc: template.id],
      preload: [:creator, :space]
    )
  end

  defp put_child_counts([]), do: []

  defp put_child_counts(templates) do
    template_ids = Enum.map(templates, & &1.id)
    milestone_counts = count_children(Milestone, template_ids)
    task_counts = count_children(Task, template_ids)

    Enum.map(templates, fn template ->
      %{template | milestone_count: Map.get(milestone_counts, template.id, 0), task_count: Map.get(task_counts, template.id, 0)}
    end)
  end

  defp count_children(schema, template_ids) do
    from(child in schema,
      where: child.project_template_id in ^template_ids,
      group_by: child.project_template_id,
      select: {child.project_template_id, count(child.id)}
    )
    |> Repo.all()
    |> Map.new()
  end
end
