defmodule OperatelyWeb.Graphql.Mutations.Updates do
  use Absinthe.Schema.Notation

  input_object :create_update_input do
    field :content, non_null(:string)
    field :updatable_id, non_null(:id)
    field :updatable_type, non_null(:string)
    field :phase, :string
    field :health, :string
    field :message_type, :string
    field :title, :string
    field :review_request_id, :string
    field :new_target_values, :string
  end

  input_object :edit_update_input do
    field :content, non_null(:string)
    field :update_id, non_null(:id)
    field :health, :string
    field :new_target_values, :string
  end

  input_object :create_comment_input do
    field :content, non_null(:string)
    field :update_id, non_null(:id)
  end

  object :update_mutations do
    field :create_update, non_null(:update) do
      arg :input, non_null(:create_update_input)

      resolve fn args, %{context: context} ->
        author = context.current_account.person
        content = Jason.decode!(args.input.content)

        case args.input.message_type do
          "goal-check-in" ->
            target_values = Jason.decode!(args.input.new_target_values)
            goal = Operately.Goals.get_goal!(args.input.updatable_id)
            Operately.Operations.GoalCheckIn.run(author, goal, content, target_values)

          "status_update" ->
            health = args.input.health
            project = Operately.Projects.get_project!(args.input.updatable_id)
            Operately.Operations.ProjectCheckIn.run(author, project, health, content)

          "review" ->
            review_request_id = args.input[:review_request_id]
            project = Operately.Projects.get_project!(args.input.updatable_id)
            Operately.Updates.record_review(author, project, args.input.phase, content, review_request_id)

          "message" ->
            project = Operately.Projects.get_project!(args.input.updatable_id)
            Operately.Updates.record_message(author, project, content)

          "project_discussion" ->
            project = Operately.Projects.get_project!(args.input.updatable_id)
            content = Jason.decode!(args.input.content)

            Operately.Updates.record_project_discussion(author, project, content["title"], content["body"])

          _ ->
            raise "Unknown message type"
        end
      end
    end

    field :edit_update, non_null(:update) do
      arg :input, non_null(:edit_update_input)

      resolve fn args, %{context: context} ->
        author = context.current_account.person
        content = Jason.decode!(args.input.content)
        update = Operately.Updates.get_update!(args.input.update_id)

        case update.type do
          :goal_check_in ->
            target_values = Jason.decode!(args.input.new_target_values)
            goal = Operately.Goals.get_goal!(update.updatable_id)
            Operately.Operations.GoalCheckInEdit.run(author, goal, update, content, target_values)

          :status_update ->
            health = args.input.health
            Operately.Operations.ProjectStatusUpdateEdit.run(author, update, health, content)

          _ ->
            raise "Unknown message type"
        end
      end
    end

    field :add_reaction, :reaction do
      arg :type, non_null(:string)
      arg :entity_id, non_null(:id)
      arg :entity_type, non_null(:string)

      resolve fn args, %{context: context} ->
        Operately.Updates.create_reaction(%{
          reaction_type: args.type,
          entity_type: args.entity_type,
          entity_id: args.entity_id,
          person_id: context.current_account.person.id
        })
      end
    end

    field :acknowledge, :update do
      arg :id, non_null(:id)

      resolve fn args, %{context: context} ->
        person = context.current_account.person
        update = Operately.Updates.get_update!(args.id)

        Operately.Updates.acknowledge_update(person, update)
      end
    end

    field :create_comment, :comment do
      arg :input, non_null(:create_comment_input)

      resolve fn args, %{context: context} ->
        update = Operately.Updates.get_update!(args.input.update_id)

        cond do
          update.type in [:project_discussion, :status_update, :review] ->
            author = context.current_account.person
            content = args.input.content

            Operately.Updates.create_comment(author, update, content)

          true ->
            Operately.Updates.create_comment(update, %{
              author_id: context.current_account.person.id,
              update_id: args.input.update_id,
              content: %{"message" => args.input.content}
            })
        end
      end
    end
  end
end
