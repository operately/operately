defmodule OperatelyWeb.GraphQL.Types.Projects do
  use Absinthe.Schema.Notation

  object :project_parent do
    field :id, :string
    field :title, non_null(:string)
    field :type, non_null(:string)
  end

  object :project_contributor do
    field :id, non_null(:id)
    field :responsibility, :string
    field :role, non_null(:string)

    field :person, non_null(:person) do
      resolve fn contributor, _, _ ->
        {:ok, contributor.person}
      end
    end
  end

  object :project do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :phase, non_null(:string)
    field :updated_at, non_null(:date)

    field :started_at, :date
    field :deadline, :date
    field :next_update_scheduled_at, :date

    field :description, :string do
      resolve fn project, _, _ ->
        {:ok, Jason.encode!(project.description)}
      end
    end

    field :milestones, list_of(:milestone) do
      resolve fn project, _, _ ->
        milestones = Operately.Projects.list_project_milestones(project)

        {:ok, milestones}
      end
    end

    field :parents, list_of(:project_parent) do
      resolve fn project, _, _ ->
        parents = Operately.Alignments.list_parents(project)

        {:ok, parents}
      end
    end

    field :contributors, list_of(:project_contributor) do
      resolve fn project, _, _ ->
        contributors = Operately.Projects.list_project_contributors(project)
        contributors = Operately.Repo.preload(contributors, :person)

        {:ok, contributors}
      end
    end

    field :activities, list_of(:activity) do
      resolve fn project, _, _ ->
        updates = Operately.Updates.list_updates(project.id, :project)

        {:ok, updates}
      end
    end
  end
end
