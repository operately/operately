defmodule OperatelyWeb.GraphQL.Mutations.Projects do
  use Absinthe.Schema.Notation

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

  object :project_mutations do
    field :create_project, non_null(:project) do
      arg :name, non_null(:string)
      arg :champion_id, non_null(:id)

      resolve fn args, %{context: context} ->
        Operately.Repo.transaction(fn -> 
          person = context.current_account.person
          
          project_attrs = %{
            company_id: person.company_id,
            creator_id: person.id,
            name: args.name
          }

          champion_attrs = %{
            person_id: args.champion_id,
            responsibility: " ",
            role: "champion"
          }

          {:ok, project} = Operately.Projects.create_project(
            project_attrs, 
            champion_attrs
          )

          project
        end)
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

      resolve fn args, _ ->
        project = Operately.Projects.get_project!(args.project_id)
        Operately.Projects.update_project(project, %{started_at: parse_date(args.start_date)})
      end
    end

    field :set_project_due_date, non_null(:project) do
      arg :project_id, non_null(:id)
      arg :due_date, :date

      resolve fn args, _ ->
        project = Operately.Projects.get_project!(args.project_id)
        Operately.Projects.update_project(project, %{deadline: parse_date(args.due_date)})
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

      resolve fn args, _ ->
        Operately.Projects.create_contributor(%{
          project_id: args.project_id,
          person_id: args.person_id,
          responsibility: args.responsibility,
          role: args.role
        })
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

      resolve fn args, _ ->
        contrib = Operately.Projects.get_contributor!(args.contrib_id)

        Operately.Projects.delete_contributor(contrib)
      end
    end

    #
    # Milestones
    #

    field :add_project_milestone, non_null(:milestone) do
      arg :project_id, non_null(:id)
      arg :title, non_null(:string)
      arg :deadline_at, :date

      resolve fn args, %{context: context} ->
        creator = context.current_account.person
        deadline = args.deadline_at && NaiveDateTime.new!(args.deadline_at, ~T[00:00:00])

        Operately.Projects.create_milestone(creator, %{
          project_id: args.project_id,
          title: args.title,
          deadline_at: deadline,
        })
      end
    end

    field :set_milestone_status, non_null(:milestone) do
      arg :milestone_id, non_null(:id)
      arg :status, non_null(:string)

      resolve fn args, %{context: context} ->
        person = context.current_account.person
        milestone = Operately.Projects.get_milestone!(args.milestone_id)

        if args.status == "done" do
          Operately.Projects.complete_milestone(person, milestone)
        else
          Operately.Projects.uncomplete_milestone(person, milestone)
        end
      end
    end

    field :update_project_milestone, non_null(:milestone) do
      arg :milestone_id, non_null(:id)
      arg :title, non_null(:string)
      arg :deadline_at, :date

      resolve fn args, _ ->
        milestone = Operately.Projects.get_milestone!(args.milestone_id)
        deadline = args.deadline_at && NaiveDateTime.new!(args.deadline_at, ~T[00:00:00])

        Operately.Projects.update_milestone(milestone, %{
          title: args.title,
          deadline_at: deadline
        })
      end
    end

    field :remove_project_milestone, non_null(:milestone) do
      arg :milestone_id, non_null(:id)

      resolve fn args, _ ->
        milestone = Operately.Projects.get_milestone!(args.milestone_id)

        Operately.Projects.delete_milestone(milestone)
      end
    end
  end
end
