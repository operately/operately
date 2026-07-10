defmodule Operately.StateMachine do

  def cast_and_validate(changeset, field, state_machine) do
    initial = Map.get(state_machine, :initial)
    states = Map.get(state_machine, :states)

    data = get_in(changeset.data, [Access.key(field)])
    change = get_in(changeset.changes, [Access.key(field)])

    is_insert = Ecto.get_meta(changeset.data, :state) == :built

    if is_insert do
      state_name = change || data || initial

      changeset
      |> Ecto.Changeset.put_change(field, state_name)
      |> run_on_enter(state_name, states)
    else
      case {data, change} do
        {nil, nil} ->
          changeset

        {old_state, nil} when old_state != nil ->
          changeset

        {old_state, new_state} when old_state == new_state ->
          changeset

        {old_state, new_state} ->
          if valid_transition?(old_state, new_state, states) do
              run_on_enter(changeset, new_state, states)
          else
            add_invalid_transition_error(changeset, field, old_state, new_state)
          end
      end
    end
  end

  defp add_invalid_transition_error(changeset, field, old_state, new_state) do
    msg = "Invalid transition from #{old_state} to #{new_state}"

    Ecto.Changeset.add_error(changeset, field, msg)
  end

  defp valid_transition?(old_state_name, new_state_name, states) do
    old_state = Enum.find(states, fn state -> state[:name] == old_state_name end)

    allowed_transitions = old_state[:allow_transition_to]

    Enum.member?(allowed_transitions, new_state_name)
  end

  defp run_on_enter(changeset, state_entered, states) do
    state = Enum.find(states, fn state -> state[:name] == state_entered end)
    on_enter = Map.get(state, :on_enter)

    if on_enter == nil do
      changeset
    else
      on_enter.(changeset)
    end
  end

end
