defmodule OperatelyWeb.Graphql.Queries.Projects do
  use Absinthe.Schema.Notation

  input_object :project_list_filters do
    field :group_id, :id
    field :objective_id, :id
    field :include_archived, :boolean
    field :only_my_projects, :boolean
  end

  object :project_queries do
    field :projects, list_of(:project) do
      arg :filters, :project_list_filters

      resolve fn _, args, %{context: context} ->
        person = context.current_account.person
        filters = Map.get(args, :filters, %{})

        projects = Operately.Projects.list_projects(person, %{
          company_id: person.company_id,
          group_id: filters[:group_id],
          objective_id: filters[:objective_id],
          include_archived: filters[:include_archived],
          only_my_projects: filters[:only_my_projects]
        })

        projects = preload_contributors(projects, filters)

        {:ok, projects}
      end
    end

    field :project, :project do
      arg :id, non_null(:id)

      resolve fn args, %{context: context} ->
        person = context.current_account.person
        project = Operately.Projects.get_project!(args.id)

        permissions = Operately.Projects.get_permissions(project, person)

        if permissions.can_view do
          {:ok, project}
        else
          {:ok, nil}
        end
      end
    end

    field :project_contributor_candidates, list_of(:person) do
      arg :project_id, non_null(:id)
      arg :query, non_null(:string)

      resolve fn _, args, _ ->
        candidates = Operately.Projects.list_project_contributor_candidates(
          args.project_id,
          args.query,
          [],
          10
        )

        {:ok, candidates}
      end
    end

    defp preload_contributors(projects, filters) do
      if filters[:group_id] && filters[:limit_contributors_to_group_members] do
        preload_only_group_members(projects, filters[:group_id])
      else
        preload_all(projects)
      end
    end

    defp preload_only_group_members(projects, group_id) do
      import Ecto.Query
      alias Operately.Projects.Contributor
      alias Operately.Groups.Member

      query = from(
        c in Contributor, 
        preload: [:person], 
        join: m in Member, on: c.person_id == m.person_id,
        where: m.group_id == ^group_id
      )

      Operately.Repo.preload(projects, contributors: query)
    end

    defp preload_all(projects) do
      Operately.Repo.preload(projects, contributors: :person)
    end

  end
end
