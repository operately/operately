defmodule Operately.StateMachine do

  def cast_and_validate(changeset, field, state_machine) do
    field = Access.key(field)
    initial = Map.get(state_machine, :initial)
    states = Map.get(state_machine, :states)

    data = get_in(changeset.data, [field])
    change = get_in(changeset.changes, [field])

    case {data, change} do
      {nil, nil} ->
        initialize_state(changeset, field, initial, states)

      {old_state, nil} when old_state != nil ->
        changeset

      {nil, state} ->
        run_on_enter(changeset, state, states)

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

  defp initialize_state(changeset, field, initial, states) do
    changeset
    |> Ecto.Changeset.put_change(field, initial)
    |> run_on_enter(initial, states)
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
