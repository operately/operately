defmodule OperatelyWeb.GraphQL.Mutations.Updates do
  use Absinthe.Schema.Notation

  input_object :create_update_input do
    field :content, non_null(:string)
    field :updatable_id, non_null(:id)
    field :updatable_type, non_null(:string)
    field :phase, :string
    field :health, :string
    field :message_type, :string
    field :title, :string
  end

  input_object :create_comment_input do
    field :content, non_null(:string)
    field :update_id, non_null(:id)
  end

  object :update_mutations do
    field :create_update, :activity do
      arg :input, non_null(:create_update_input)

      resolve fn args, %{context: context} ->
        Operately.Repo.transaction(fn -> 
          content = Jason.decode!(args.input.content)
          project = Operately.Projects.get_project!(args.input.updatable_id)

          title = args.input[:title] || ""

          previous_phase = Atom.to_string(project.phase)
          new_phase = args.input[:phase] || previous_phase

          previous_health = Atom.to_string(project.health)
          new_health = args.input[:health] || previous_health

          if args.input[:phase] do
            Operately.Projects.update_project(project, %{phase: args.input.phase})
            Operately.Projects.record_phase_history(project, previous_phase, new_phase)
          end

          if args.input[:health] do
            Operately.Projects.update_project(project, %{health: args.input.health})
          end

          {:ok, update} = Operately.Updates.create_update(%{
            updatable_type: args.input.updatable_type,
            updatable_id: args.input.updatable_id,
            author_id: context.current_account.person.id,
            title: title,
            type: args.input.message_type,
            content: Operately.Updates.Types.StatusUpdate.build(project, new_health, content)
          })

          update
        end)
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

        Operately.Updates.create_comment(update, %{
          author_id: context.current_account.person.id,
          update_id: args.input.update_id,
          content: %{"message" => args.input.content}
        })
      end
    end
  end
end
