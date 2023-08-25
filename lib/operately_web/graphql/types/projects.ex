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

  object :project_key_resource do
    field :id, non_null(:id)
    field :title, non_null(:string)
    field :link, non_null(:string)
  end

  object :project_phase_history do
    field :id, non_null(:id)
    field :phase, non_null(:string)
    field :start_time, non_null(:date)
    field :end_time, :date
  end

  object :project do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :health, non_null(:string)
    field :phase, non_null(:string)

    field :inserted_at, non_null(:date)
    field :updated_at, non_null(:date)

    field :started_at, :date
    field :deadline, :date
    field :next_update_scheduled_at, :date

    field :phase_history, list_of(:project_phase_history) do
      resolve fn project, _, _ ->
        {:ok, Operately.Projects.list_project_phase_history(project)}
      end
    end

    field :key_resources, list_of(:project_key_resource) do
      resolve fn project, _, _ ->
        {:ok, Operately.Projects.list_key_resources(project)}
      end
    end

    field :next_milestone, :milestone do
      resolve fn project, _, _ ->
        {:ok, Operately.Projects.get_next_milestone(project)}
      end
    end

    field :is_pinned, non_null(:boolean) do
      resolve fn project, _, %{context: context} ->
        person = context.current_account.person

        if person.home_dashboard_id do
          pinned = Operately.Dashboards.has_panel?(person.home_dashboard_id, "pinned-project", project.id)
          {:ok, pinned}
        else
          {:ok, false}
        end
      end
    end

    field :description, :string do
      resolve fn project, _, _ ->
        {:ok, project.description && Jason.encode!(project.description)}
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
      resolve fn project, _, _info ->
        if Ecto.assoc_loaded?(project.contributors) do
          {:ok, project.contributors}
        else
          project = Operately.Repo.preload(project, contributors: :person)

          {:ok, project.contributors}
        end
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
