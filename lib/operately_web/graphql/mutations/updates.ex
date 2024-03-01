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

          _ ->
            raise "Unknown message type"
        end
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
  end
end
