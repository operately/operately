defmodule OperatelyWeb.GraphQL.Types.Projects do
  use Absinthe.Schema.Notation
  
  alias Operately.Projects

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

  object :project_document do
    field :id, non_null(:id)
    field :title, non_null(:string)
    field :inserted_at, non_null(:date)

    field :content, non_null(:string) do
      resolve fn document, _, _ ->
        {:ok, Jason.encode!(document.content)}
      end
    end

    field :author, non_null(:person) do
      resolve fn document, _, _ ->
        person = Operately.People.get_person!(document.author_id)
        {:ok, person}
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

    field :is_pinned, non_null(:boolean) do
      resolve fn project, _, %{context: context} ->
        person = context.current_account.person

        {:ok, Operately.People.is_pinned?(person, :project, project.id)}
      end
    end

    field :description, :string do
      resolve fn project, _, _ ->
        {:ok, Jason.encode!(project.description)}
      end
    end

    field :updates, list_of(:update) do
      resolve fn project, _, _ ->
        updates = Operately.Updates.list_updates(project.id, :project)
        {:ok, updates}
      end
    end

    field :champion, :person do
      resolve fn project, _, _ ->
        {:ok, Projects.get_person_by_role(project, :champion)}
      end
    end

    field :reviewer, :person do
      resolve fn project, _, _ ->
        {:ok, Projects.get_person_by_role(project, :reviewer)}
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

    # project documents

    field :pitch, :project_document do
      resolve fn project, _, _ ->
        {:ok, Operately.Projects.get_pitch(project)}
      end
    end

    field :plan, :project_document do
      resolve fn project, _, _ ->
        {:ok, Operately.Projects.get_plan(project)}
      end
    end

    field :execution_review, :project_document do
      resolve fn project, _, _ ->
        {:ok, Operately.Projects.get_execution_review(project)}
      end
    end

    field :retrospective, :project_document do
      resolve fn project, _, _ ->
        {:ok, Operately.Projects.get_retrospective(project)}
      end
    end
  end
end
