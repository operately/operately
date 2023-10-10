defmodule OperatelyWeb.GraphQL.Mutations.Projects do
  use Absinthe.Schema.Notation

  input_object :create_project_input do
    field :name, non_null(:string)
    field :champion_id, non_null(:id)
    field :visibility, non_null(:string)
    field :creator_role, :string
  end

  input_object :add_key_resource_input do
    field :project_id, non_null(:id)
    field :title, non_null(:string)
    field :link, non_null(:string)
  end

  input_object :edit_key_resource_input do
    field :id, non_null(:id)
    field :title, non_null(:string)
    field :link, non_null(:string)
  end

  input_object :edit_project_timeline_input do
    field :project_id, non_null(:id)
    field :planning_due_time, :date
    field :execution_due_time, :date
    field :control_due_time, :date
  end

  object :project_mutations do
    field :edit_project_timeline, non_null(:project) do
      arg :input, non_null(:edit_project_timeline_input)

      resolve fn args, _ ->
        Operately.Repo.transaction(fn ->
          project = Operately.Projects.get_project!(args.input.project_id)
          phases = Operately.Projects.list_project_phase_history(project)

          planning = Enum.find(phases, fn phase -> phase.phase == :planning end)
          execution = Enum.find(phases, fn phase -> phase.phase == :execution end)
          control = Enum.find(phases, fn phase -> phase.phase == :control end)

          {:ok, _} = Operately.Projects.update_phase_history(planning, %{
            start_time: project.started_at,
            due_time: parse_date(args.input.planning_due_time)
          })

          {:ok, _} = Operately.Projects.update_phase_history(execution, %{
            start_time: parse_date(args.input.planning_due_time),
            due_time: parse_date(args.input.execution_due_time)
          })

          {:ok, _} = Operately.Projects.update_phase_history(control, %{
            start_time: parse_date(args.input.execution_due_time),
            due_time: parse_date(args.input.control_due_time
          )})

          {:ok, project} = Operately.Projects.update_project(project, %{deadline: parse_date(args.input.control_due_time)})

          project
        end)
      end
    end

    field :create_project, non_null(:project) do
      arg :input, non_null(:create_project_input)

      resolve fn args, %{context: context} ->
        person = context.current_account.person

        %Operately.Projects.ProjectCreation{
          name: args.input.name,
          champion_id: args.input.champion_id,
          creator_role: args.input[:creator_role],
          visibility: args.input.visibility,
          creator_id: person.id,
          company_id: person.company_id
        }
        |> Operately.Projects.create_project()
      end
    end

    field :add_key_resource, non_null(:project_key_resource) do
      arg :input, non_null(:add_key_resource_input)

      resolve fn args, _ ->
        Operately.Projects.create_key_resource(args.input)
      end
    end

    field :edit_key_resource, non_null(:project_key_resource) do
      arg :input, non_null(:edit_key_resource_input)

      resolve fn args, _ ->
        resource = Operately.Projects.get_key_resource!(args.input.id)

        Operately.Projects.update_key_resource(resource, args.input)
      end
    end

    field :remove_key_resource, non_null(:project_key_resource) do
      arg :id, non_null(:id)

      resolve fn args, _ ->
        resource = Operately.Projects.get_key_resource!(args.id)
        Operately.Projects.delete_key_resource(resource)
      end
    end

    field :update_project_description, non_null(:project) do
      arg :project_id, non_null(:id)
      arg :description, :string

      resolve fn args, _ ->
        project = Operately.Projects.get_project!(args.project_id)

        Operately.Projects.update_project(project, %{description: Jason.decode!(args.description)})
      end
    end

    field :set_project_start_date, non_null(:project) do
      arg :project_id, non_null(:id)
      arg :start_date, :date

      resolve fn args, %{context: context} ->
        Operately.Repo.transaction(fn ->
          person = context.current_account.person
          project = Operately.Projects.get_project!(args.project_id)
          history = Operately.Projects.find_first_phase_history(args.project_id)
          old_start_date = project.started_at

          {:ok, project} = Operately.Projects.update_project(project, %{started_at: parse_date(args.start_date)})
          {:ok, _} = Operately.Projects.update_phase_history(history, %{start_time: parse_date(args.start_date)})
          {:ok, _} = Operately.Updates.record_project_start_time_changed(
            person, 
            project, 
            old_start_date,
            parse_date(args.start_date)
          )

          project
        end)
      end
    end

    field :set_project_due_date, non_null(:project) do
      arg :project_id, non_null(:id)
      arg :due_date, :date

      resolve fn args, %{context: context} ->
        Operately.Repo.transaction(fn ->
          person = context.current_account.person
          project = Operately.Projects.get_project!(args.project_id)

          {:ok, project} = Operately.Projects.update_project(project, %{deadline: parse_date(args.due_date)})
          old_due_date = project.deadline

          {:ok, _} = Operately.Updates.record_project_end_time_changed(
            person, 
            project, 
            old_due_date,
            parse_date(args.due_date)
          )

          project
        end)
      end
    end

    defp parse_date(date) do
      if date do
        NaiveDateTime.new!(date, ~T[00:00:00])
      else
        nil
      end
    end

    field :pin_project_to_home_page, non_null(:boolean) do
      arg :project_id, non_null(:id)

      resolve fn args, %{context: context} ->
        person = context.current_account.person

        if person.home_dashboard_id do
          if Operately.Dashboards.has_panel?(person.home_dashboard_id, "pinned-project", args.project_id) do
            Operately.Dashboards.remove_panel(person.home_dashboard_id, "pinned-project", args.project_id)
          else
            {:ok, _} = Operately.Dashboards.create_panel(%{
              dashboard_id: person.home_dashboard_id,
              type: "pinned-project",
              linked_resource_id: args.project_id,
              linked_resource_type: "project"
            })
          end

          {:ok, true}
        else
          {:ok, false}
        end
      end
    end

    #
    # Documents
    #

    field :post_project_document, non_null(:project_document) do
      arg :project_id, non_null(:id)
      arg :type, non_null(:string)
      arg :content, non_null(:string)

      resolve fn args, %{context: context} ->
        Operately.Repo.transaction(fn ->
          project = Operately.Projects.get_project!(args.project_id)

          {:ok, document} = Operately.Projects.create_document(%{
            project_id: args.project_id,
            title: "New document",
            content: Jason.decode!(args.content),
            author_id: context.current_account.person.id
          })

          change = case args.type do
            "pitch" -> %{pitch_document_id: document.id}
            "plan" -> %{plan_document_id: document.id}
            "execution_review" -> %{execution_review_document_id: document.id}
            "control_review" -> %{control_review_document_id: document.id}
            "retrospective" -> %{retrospective_document_id: document.id}
            type -> raise "Unknown document type #{type}"
          end

          {:ok, _} = Operately.Projects.update_project(project, change)

          document
        end)
      end
    end

    #
    # Contributors
    #

    field :add_project_contributor, non_null(:project_contributor) do
      arg :project_id, non_null(:id)
      arg :person_id, non_null(:id)
      arg :responsibility, non_null(:string)
      arg :role, non_null(:string)

      resolve fn args, %{context: context} ->
        person = context.current_account.person

        Operately.Repo.transaction(fn ->
          {:ok, contributor} = Operately.Projects.create_contributor(%{
            project_id: args.project_id,
            person_id: args.person_id,
            responsibility: args.responsibility,
            role: args.role
          })

          {:ok, _} = Operately.Updates.record_project_contributor_added(
            person, 
            args.project_id,
            contributor
          )
          
          contributor
        end)
      end
    end

    field :update_project_contributor, non_null(:project_contributor) do
      arg :contrib_id, non_null(:id)
      arg :person_id, non_null(:id)
      arg :responsibility, non_null(:string)

      resolve fn args, _ ->
        contrib = Operately.Projects.get_contributor!(args.contrib_id)

        Operately.Projects.update_contributor(contrib, %{
          person_id: args.person_id,
          responsibility: args.responsibility
        })
      end
    end

    field :remove_project_contributor, non_null(:project_contributor) do
      arg :contrib_id, non_null(:id)

      resolve fn args, %{context: context} ->
        person = context.current_account.person

        Operately.Repo.transaction(fn ->
          contrib = Operately.Projects.get_contributor!(args.contrib_id)

          {:ok, contrib} = Operately.Projects.delete_contributor(contrib)

          {:ok, _} = Operately.Updates.record_project_contributor_removed(
            person, 
            contrib.project_id,
            contrib
          )

          contrib
        end)
      end
    end

    field :archive_project, non_null(:project) do
      arg :project_id, non_null(:id)

      resolve fn args, %{context: context} ->
        person = context.current_account.person
        project = Operately.Projects.get_project!(args.project_id)

        Operately.Projects.archive_project(person, project)

        {:ok, project}
      end
    end
  end
end
