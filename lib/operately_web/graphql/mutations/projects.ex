defmodule OperatelyWeb.GraphQL.Mutations.Projects do
  use Absinthe.Schema.Notation

  object :project_mutations do
    field :create_project, non_null(:project) do
      arg :name, non_null(:string)
      arg :champion_id, non_null(:id)

      resolve fn args, %{context: context} ->
        Operately.Repo.transaction(fn -> 
          person = context.current_account.person

          {:ok, project} = Operately.Projects.create_project(%{
            company_id: person.company_id,
            creator_id: person.id,
            name: args.name
          })

          Operately.Projects.create_contributor(%{
            project_id: project.id,
            person_id: args.champion_id,
            responsibility: " ",
            role: "champion"
          })

          project
        end)
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

      resolve fn args, _ ->
        deadline = args.deadline_at && NaiveDateTime.new!(args.deadline_at, ~T[00:00:00])

        Operately.Projects.create_milestone(%{
          project_id: args.project_id,
          title: args.title,
          deadline_at: deadline
        })
      end
    end

    field :set_milestone_status, non_null(:milestone) do
      arg :milestone_id, non_null(:id)
      arg :status, non_null(:string)

      resolve fn args, _ ->
        milestone = Operately.Projects.get_milestone!(args.milestone_id)

        Operately.Projects.update_milestone(milestone, %{status: args.status})
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
