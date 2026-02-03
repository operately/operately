defmodule OperatelyWeb.Api.Goals do
  alias __MODULE__.SharedMultiSteps, as: Steps

  alias Operately.Goals.{Goal, Target}
  alias Operately.Access
  alias Operately.Access.Binding
  alias OperatelyWeb.Api.Serializer

  defmodule GetDiscussions do
    use TurboConnect.Query

    inputs do
      field :goal_id, :id, null: false
    end

    outputs do
      field :discussions, list_of(:discussion), null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_view)
      |> Steps.get_discussions()
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{discussions: Serializer.serialize(changes.discussions, level: :essential)}
      end)
    end
  end

  defmodule ParentGoalSearch do
    use TurboConnect.Query

    inputs do
      field :query, :string, null: false
      field :goal_id, :id, null: false
    end

    outputs do
      field :goals, list_of(:goal), null: false
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_view)
      |> Steps.find_potential_parent_goals(inputs.query)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{goals: Serializer.serialize(changes.goals, level: :essential)}
      end)
    end
  end

  defmodule UpdateName do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, null: false
      field :name, :string, null: false
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.update_goal_name(inputs.name)
      |> Steps.save_activity(:goal_name_updating, fn changes ->
        %{
          company_id: changes.goal.company_id,
          space_id: changes.goal.group_id,
          goal_id: changes.goal.id,
          old_name: changes.goal.name,
          new_name: changes.updated_goal.name
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule UpdateDescription do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, null: false
      field :description, :json, null: false
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.update_goal_description(inputs.description)
      |> Steps.save_activity(:goal_description_changed, fn changes ->
        %{
          company_id: changes.goal.company_id,
          space_id: changes.goal.group_id,
          goal_id: changes.goal.id,
          goal_name: changes.goal.name,
          old_description: changes.goal.description,
          new_description: inputs.description,
          has_description: Operately.RichContent.empty?(inputs.description)
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule UpdateDueDate do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, null: false
      field :due_date, :contextual_date, null: true
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.update_goal_due_date(inputs.due_date)
      |> Steps.save_activity(:goal_due_date_updating, fn changes ->
        %{
          company_id: changes.goal.company_id,
          space_id: changes.goal.group_id,
          goal_id: changes.goal.id,
          old_due_date: Operately.ContextualDates.Timeframe.end_date(changes.goal.timeframe),
          new_due_date: Operately.ContextualDates.Timeframe.end_date(changes.updated_goal.timeframe)
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule UpdateStartDate do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, null: false
      field :start_date, :contextual_date, null: true
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.update_goal_start_date(inputs.start_date)
      |> Steps.save_activity(:goal_start_date_updating, fn changes ->
        %{
          company_id: changes.goal.company_id,
          space_id: changes.goal.group_id,
          goal_id: changes.goal.id,
          old_start_date: Operately.ContextualDates.Timeframe.start_date(changes.goal.timeframe),
          new_start_date: Operately.ContextualDates.Timeframe.start_date(changes.updated_goal.timeframe)
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule UpdateParentGoal do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, null: false
      field :parent_goal_id, :id, null: true
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.update_parent_goal(inputs.parent_goal_id)
      |> Steps.save_activity(:goal_reparent, fn changes ->
        %{
          company_id: changes.goal.company_id,
          space_id: changes.goal.group_id,
          goal_id: changes.goal.id,
          old_parent_goal_id: changes.goal.parent_goal_id,
          new_parent_goal_id: inputs.parent_goal_id
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule UpdateSpace do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, null: false
      field :space_id, :id, null: false
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.check_idempotency(fn %{goal: goal} -> goal.group_id == inputs.space_id end)
      |> Steps.update_space(inputs.space_id)
      |> Steps.save_activity(:goal_space_updating, fn changes ->
        %{
          company_id: changes.goal.company_id,
          space_id: changes.updated_goal.group_id,
          goal_id: changes.goal.id,
          old_space_id: changes.goal.group_id
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule AddTarget do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, null: false
      field :name, :string, null: false
      field :start_value, :float, null: false
      field :target_value, :float, null: false
      field :unit, :string, null: false
    end

    outputs do
      field :target_id, :id, null: true
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit_target)
      |> Steps.add_target(inputs.name, inputs.start_value, inputs.target_value, inputs.unit)
      |> Steps.save_activity(:goal_target_adding, fn changes ->
        %{
          company_id: changes.goal.company_id,
          space_id: changes.goal.group_id,
          goal_id: changes.goal.id,
          target_name: changes.added_target.name
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{success: true, target_id: changes.added_target.id}
      end)
    end
  end

  defmodule DeleteTarget do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, null: false
      field :target_id, :id, null: false
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit_target)
      |> Steps.find_target(inputs.target_id)
      |> Steps.delete_target()
      |> Steps.save_activity(:goal_target_deleting, fn changes ->
        %{
          company_id: changes.goal.company_id,
          space_id: changes.goal.group_id,
          goal_id: changes.goal.id,
          target_name: changes.target.name
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule UpdateTarget do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, null: false
      field :target_id, :id, null: false

      field? :name, :string, null: true
      field? :start_value, :float, null: true
      field? :target_value, :float, null: true
      field? :unit, :string, null: true
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit_target)
      |> Steps.find_target(inputs.target_id)
      |> Steps.update_target(inputs)
      # |> Steps.save_activity(:goal_target_updated, fn changes ->
      #   %{
      #     company_id: changes.goal.company_id,
      #     space_id: changes.goal.group_id,
      #     goal_id: changes.goal.id,
      #     target_id: changes.target.id,
      #     old_name: changes.target.name,
      #     new_name: changes.updated_target.name,
      #     old_start_value: changes.target.start_value,
      #     new_start_value: changes.updated_target.start_value,
      #     old_target_value: changes.target.target_value,
      #     new_target_value: changes.updated_target.target_value,
      #     old_unit: changes.target.unit,
      #     new_unit: changes.updated_target.unit
      #   }
      # end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule UpdateTargetValue do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, null: false
      field :target_id, :id, null: false
      field :value, :float, null: false
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit_target)
      |> Steps.find_target(inputs.target_id)
      |> Steps.update_target_value(inputs.value)
      |> Steps.save_activity(:goal_target_updating, fn changes ->
        %{
          company_id: changes.goal.company_id,
          space_id: changes.goal.group_id,
          goal_id: changes.goal.id,
          target_name: changes.target.name,
          old_value: to_string(changes.target.value),
          new_value: to_string(changes.updated_target.value),
          unit: changes.updated_target.unit
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule UpdateTargetIndex do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, null: false
      field :target_id, :id, null: false
      field :index, :integer, null: false
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit_target)
      |> Steps.find_target(inputs.target_id)
      |> Steps.update_target_index(inputs.index)
      # |> Steps.save_activity(:goal_target_index_updated, fn changes ->
      #   %{
      #     company_id: changes.goal.company_id,
      #     space_id: changes.goal.group_id,
      #     goal_id: changes.goal.id,
      #     target_id: changes.target.id,
      #     old_index: changes.target.index,
      #     new_index: changes.updated_target.index
      #   }
      # end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule UpdateChampion do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, null: false
      field :champion_id, :id, null: true
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.update_goal_champion(inputs.champion_id)
      |> Steps.save_activity(:goal_champion_updating, fn changes ->
        %{
          company_id: changes.goal.company_id,
          space_id: changes.goal.group_id,
          goal_id: changes.goal.id,
          old_champion_id: changes.goal.champion_id,
          new_champion_id: inputs.champion_id
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule UpdateReviewer do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, null: false
      field :reviewer_id, :id, null: true
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.update_goal_reviewer(inputs.reviewer_id)
      |> Steps.save_activity(:goal_reviewer_updating, fn changes ->
        %{
          company_id: changes.goal.company_id,
          space_id: changes.goal.group_id,
          goal_id: changes.goal.id,
          old_reviewer_id: changes.goal.reviewer_id,
          new_reviewer_id: inputs.reviewer_id
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule UpdateAccessLevels do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id
      field :access_levels, :access_levels
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.update_access_levels(inputs.access_levels)
      # |> Steps.save_activity(:goal_access_levels_updated, fn changes ->
      #   %{
      #     company_id: changes.goal.company_id,
      #     space_id: changes.goal.group_id,
      #     goal_id: changes.goal.id,
      #     access_levels: inputs.access_levels
      #   }
      # end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule ListAccessMembers do
    use TurboConnect.Query

    inputs do
      field :goal_id, :id, null: false
    end

    outputs do
      field :people, list_of(:person), null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit_access_level)
      |> Steps.list_access_members()
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{people: Serializer.serialize(changes.access_members, level: :essential)}
      end)
    end
  end

  defmodule AddAccessMembers do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, null: false
      field :members, list_of(:add_member_input), null: false
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit_access_level)
      |> Steps.add_access_members(inputs.members)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule UpdateAccessMember do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, null: false
      field :person_id, :id, null: false
      field :access_level, :integer, null: false
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit_access_level)
      |> Steps.update_access_member(inputs.person_id, inputs.access_level)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule RemoveAccessMember do
    use TurboConnect.Mutation

    inputs do
      field :goal_id, :id, null: false
      field :person_id, :id, null: false
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_goal(inputs.goal_id)
      |> Steps.check_permissions(:can_edit_access_level)
      |> Steps.remove_access_member(inputs.person_id)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule SharedMultiSteps do
    require Logger

    def start_transaction(conn) do
      Ecto.Multi.new()
      |> Ecto.Multi.put(:conn, conn)
      |> Ecto.Multi.run(:me, fn _repo, %{conn: conn} ->
        {:ok, conn.assigns.current_person}
      end)
    end

    def find_goal(multi, goal_id) do
      Ecto.Multi.run(multi, :goal, fn _repo, %{me: me} ->
        case Operately.Goals.Goal.get(me, id: goal_id, opts: [preload: [:access_context]]) do
          {:ok, goal} -> {:ok, goal}
          {:error, _} -> {:error, {:not_found, "Goal not found"}}
        end
      end)
    end

    def check_permissions(multi, permission) do
      Ecto.Multi.run(multi, :permissions, fn _repo, %{goal: goal} ->
        Operately.Goals.Permissions.check(goal.request_info.access_level, permission)
      end)
    end

    def list_access_members(multi) do
      Ecto.Multi.run(multi, :access_members, fn _repo, %{goal: goal} ->
        {:ok, Operately.Goals.list_goal_access_people(goal.id)}
      end)
    end

    def add_access_members(multi, members) do
      members = List.wrap(members)

      Ecto.Multi.run(multi, :added_access_members, fn _repo, %{goal: goal} ->
        context = goal.access_context

        bindings =
          members
          |> Enum.reject(fn member -> is_nil(member.id) end)
          |> Enum.map(fn member ->
            {:ok, binding} = Access.bind_person(context, member.id, member.access_level)
            binding
          end)

        {:ok, bindings}
      end)
    end

    def update_access_member(multi, person_id, access_level) do
      Ecto.Multi.run(multi, :updated_access_member, fn _repo, %{goal: goal} ->
        context = goal.access_context
        Access.bind_person(context, person_id, access_level)
      end)
    end

    def remove_access_member(multi, person_id) do
      Ecto.Multi.run(multi, :removed_access_member, fn _repo, %{goal: goal} ->
        context = goal.access_context
        Access.unbind_person(context, person_id)
      end)
    end

    def save_activity(multi, activity_type, callback) do
      Ecto.Multi.merge(multi, fn changes ->
        Operately.Activities.insert_sync(Ecto.Multi.new(), changes.me.id, activity_type, fn _ -> callback.(changes) end)
      end)
    end

    def update_goal_name(multi, new_name) do
      Ecto.Multi.update(multi, :updated_goal, fn %{goal: goal} ->
        Operately.Goals.Goal.changeset(goal, %{name: new_name})
      end)
    end

    def update_goal_description(multi, new_description) do
      Ecto.Multi.update(multi, :updated_goal, fn %{goal: goal} ->
        Operately.Goals.Goal.changeset(goal, %{description: new_description})
      end)
    end

    def update_access_levels(multi, access_levels) do
      multi
      |> Ecto.Multi.run(:updated_company_binding, fn _repo, %{goal: goal} ->
        context = Access.get_context(goal_id: goal.id)
        company_members = Access.get_group!(company_id: goal.company_id, tag: :standard)
        company_binding = Access.get_binding(context_id: context.id, group_id: company_members.id)

        Access.update_binding(company_binding, %{access_level: access_levels.company})
      end)
      |> Ecto.Multi.run(:update_space_binding, fn _repo, %{goal: goal} ->
        context = Access.get_context(goal_id: goal.id)
        space_members = Access.get_group!(group_id: goal.group_id, tag: :standard)
        space_binding = Access.get_binding(context_id: context.id, group_id: space_members.id)

        Access.update_binding(space_binding, %{access_level: access_levels.space})
      end)
    end

    def update_goal_due_date(multi, new_due_date) do
      Ecto.Multi.update(multi, :updated_goal, fn %{goal: goal} ->
        cond do
          new_due_date == nil && goal.timeframe == nil ->
            Operately.Goals.Goal.changeset(goal, %{timeframe: nil})

          goal.timeframe == nil ->
            Operately.Goals.Goal.changeset(goal, %{
              timeframe: %{
                contextual_start_date: nil,
                contextual_end_date: new_due_date
              }
            })

          true ->
            Operately.Goals.Goal.changeset(goal, %{
              timeframe: %{
                contextual_start_date: goal.timeframe.contextual_start_date,
                contextual_end_date: new_due_date
              }
            })
        end
      end)
    end

    def update_goal_start_date(multi, new_start_date) do
      Ecto.Multi.update(multi, :updated_goal, fn %{goal: goal} ->
        cond do
          new_start_date == nil && goal.timeframe == nil ->
            Operately.Goals.Goal.changeset(goal, %{timeframe: nil})

          goal.timeframe == nil ->
            Operately.Goals.Goal.changeset(goal, %{
              timeframe: %{
                contextual_start_date: new_start_date,
                contextual_end_date: nil
              }
            })

          true ->
            Operately.Goals.Goal.changeset(goal, %{
              timeframe: %{
                contextual_start_date: new_start_date,
                contextual_end_date: goal.timeframe.contextual_end_date
              }
            })
        end
      end)
    end

    def update_parent_goal(multi, parent_goal_id) do
      Ecto.Multi.update(multi, :updated_goal, fn %{goal: goal} ->
        Operately.Goals.Goal.changeset(goal, %{parent_goal_id: parent_goal_id})
      end)
    end

    def update_space(multi, space_id) do
      Ecto.Multi.update(multi, :updated_goal, fn %{goal: goal} ->
        Operately.Goals.Goal.changeset(goal, %{group_id: space_id})
      end)
    end

    def update_goal_champion(multi, champion_id) do
      multi
      |> Ecto.Multi.update(:updated_goal, fn %{goal: goal} ->
        Goal.changeset(goal, %{champion_id: champion_id})
      end)
      |> Ecto.Multi.run(:remove_previous_access_binding, fn _repo, %{goal: goal} ->
        case goal.champion_id do
          nil -> {:ok, nil}
          _ -> Operately.Access.unbind_person(goal.access_context, goal.champion_id, :champion)
        end
      end)
      |> Ecto.Multi.run(:add_new_access_binding, fn _repo, %{goal: goal} ->
        case champion_id do
          nil -> {:ok, nil}
          _ -> Access.bind_person(goal.access_context, champion_id, Binding.full_access(), :champion)
        end
      end)
    end

    def update_goal_reviewer(multi, reviewer_id) do
      multi
      |> Ecto.Multi.update(:updated_goal, fn %{goal: goal} ->
        Goal.changeset(goal, %{reviewer_id: reviewer_id})
      end)
      |> Ecto.Multi.run(:remove_previous_access_binding, fn _repo, %{goal: goal} ->
        case goal.reviewer_id do
          nil -> {:ok, nil}
          _ -> Access.unbind_person(goal.access_context, goal.reviewer_id, :reviewer)
        end
      end)
      |> Ecto.Multi.run(:add_new_access_binding, fn _repo, %{goal: goal} ->
        case reviewer_id do
          nil -> {:ok, nil}
          _ -> Access.bind_person(goal.access_context, reviewer_id, Binding.full_access(), :reviewer)
        end
      end)
    end

    def add_target(multi, name, start_value, target_value, unit) do
      Ecto.Multi.insert(multi, :added_target, fn %{goal: goal} ->
        Target.changeset(%{
          goal_id: goal.id,
          name: name,
          value: start_value,
          from: start_value,
          to: target_value,
          unit: unit,
          index: Goal.target_count(goal) + 1
        })
      end)
    end

    def find_target(multi, target_id) do
      Ecto.Multi.run(multi, :target, fn _, _ ->
        case Operately.Repo.get(Target, target_id) do
          nil -> {:error, {:not_found, "Target not found"}}
          target -> {:ok, target}
        end
      end)
    end

    def update_target_index(multi, index) do
      Ecto.Multi.merge(multi, fn %{goal: goal, target: target} ->
        goal
        |> Operately.Repo.preload(:targets)
        |> Map.get(:targets, [])
        |> Enum.sort_by(& &1.index)
        |> Enum.reject(&(&1.id == target.id))
        |> List.insert_at(index, target)
        |> Enum.with_index(1)
        |> Enum.reduce(Ecto.Multi.new(), fn {t, idx}, m ->
          Ecto.Multi.update(m, {:update_target_index, t.id}, Target.changeset(t, %{index: idx}))
        end)
      end)
    end

    def get_discussions(multi) do
      Ecto.Multi.run(multi, :discussions, fn _repo, %{goal: goal} ->
        {:ok, Operately.Goals.Discussion.list(goal.id)}
      end)
    end

    def delete_target(multi) do
      Ecto.Multi.delete(multi, :deleted_target, fn %{target: target} -> target end)
    end

    def update_target(multi, attrs) do
      Ecto.Multi.update(multi, :updated_target, fn %{target: target} ->
        update_attrs = %{}
        update_attrs = if attrs.name, do: Map.put(update_attrs, :name, attrs.name), else: update_attrs
        update_attrs = if attrs.start_value, do: Map.put(update_attrs, :from, attrs.start_value), else: update_attrs
        update_attrs = if attrs.target_value, do: Map.put(update_attrs, :to, attrs.target_value), else: update_attrs
        update_attrs = if attrs.unit, do: Map.put(update_attrs, :unit, attrs.unit), else: update_attrs

        Operately.Goals.Target.changeset(target, update_attrs)
      end)
    end

    def find_potential_parent_goals(multi, query) do
      Ecto.Multi.run(multi, :goals, fn _repo, %{goal: goal} ->
        {:ok, Goal.search_potential_parent_goals(goal, goal.request_info.requester, query)}
      end)
    end

    def update_target_value(multi, value) do
      Ecto.Multi.update(multi, :updated_target, fn %{target: target} ->
        Operately.Goals.Target.changeset(target, %{value: value})
      end)
    end

    def check_idempotency(multi, check_fn) do
      Ecto.Multi.run(multi, :idempotency_check, fn _repo, changes ->
        if check_fn.(changes) do
          {:error, :idempotent}
        else
          {:ok, nil}
        end
      end)
    end

    def commit(multi) do
      Operately.Repo.transaction(multi)
    end

    def respond(result, ok_callback, error_callback \\ &handle_error/1) do
      case result do
        {:ok, changes} ->
          {:ok, ok_callback.(changes)}

        {:error, _, :idempotent, changes} ->
          {:ok, ok_callback.(changes)}

        e ->
          error_callback.(e)
      end
    end

    defp handle_error(reason) do
      case reason do
        {:error, _failed_operation, {:not_found, message}, _changes} ->
          {:error, :not_found, message}

        {:error, _failed_operation, :not_found, _changes} ->
          {:error, :not_found}

        {:error, _failed_operation, :forbidden, _changes} ->
          {:error, :not_found}

        {:error, _failed_operation, reason, _changes} ->
          Logger.error("Transaction failed: #{inspect(reason)}")
          {:error, :internal_server_error}

        e ->
          Logger.error("Unexpected error: #{inspect(e)}")
          {:error, :internal_server_error}
      end
    end
  end
end
