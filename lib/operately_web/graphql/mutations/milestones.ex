defmodule OperatelyWeb.GraphQL.Mutations.Milestones do
  use Absinthe.Schema.Notation

  input_object :update_milestone_description_input do
    field :id, non_null(:id)
    field :description, :string
  end

  input_object :post_milestone_comment_input do
    field :milestone_id, non_null(:id)
    field :content, non_null(:string)
    field :action, non_null(:string)
  end

  object :milestone_mutations do
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

    field :set_milestone_deadline, non_null(:milestone) do
      arg :milestone_id, non_null(:id)
      arg :deadline_at, :date

      resolve fn args, %{context: context} ->
        person = context.current_account.person
        deadline = args.deadline_at && NaiveDateTime.new!(args.deadline_at, ~T[00:00:00])
        milestone = Operately.Projects.get_milestone!(args.milestone_id)

        Operately.Projects.update_milestone_deadline(person, milestone, deadline)
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

      resolve fn args, %{context: context} ->
        person = context.current_account.person
        milestone = Operately.Projects.get_milestone!(args.milestone_id)

        Operately.Projects.delete_milestone(person, milestone)

        {:ok, milestone}
      end
    end

    field :update_milestone_description, non_null(:milestone) do
      arg :input, non_null(:update_milestone_description_input)

      resolve fn args, _ ->
        milestone = Operately.Projects.get_milestone!(args.input.id)

        Operately.Projects.update_milestone(milestone, %{
          description: Jason.decode!(args.input.description)
        })
      end
    end

    field :post_milestone_comment, non_null(:milestone_comment) do
      arg :input, non_null(:post_milestone_comment_input)

      resolve fn args, %{context: context} ->
        action = args.input.action
        person = context.current_account.person
        milestone = Operately.Projects.get_milestone!(args.input.milestone_id)

        Operately.Comments.create_milestone_comment(
          person,
          milestone, 
          action,
          %{
            content: %{
              "message" => Jason.decode!(args.input.content),
            },
            author_id: person.id,
          }
        )
      end
    end
  end
end
