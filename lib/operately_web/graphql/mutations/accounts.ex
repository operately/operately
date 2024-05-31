defmodule OperatelyWeb.Graphql.Mutations.Accounts do
  use Absinthe.Schema.Notation

  input_object :change_password_input do
    field :token, non_null(:string)
    field :password, non_null(:string)
    field :password_confirmation, non_null(:string)
  end

  object :account_mutations do
    field :change_password_first_time, :string do
      arg :input, non_null(:change_password_input)

      resolve fn %{input: input}, _ ->
        case valid_password_input(input) do
          :ok ->
            Operately.Operations.PasswordChanging.run(input)
            {:ok, "Password successfully changed"}
          {:error, reason} ->
            {:error, reason}
        end
      end
    end
  end

  defp valid_password_input(input) do
    cond do
      input.password != input.password_confirmation ->
        {:error, "Passwords don't match"}
      Operately.Invitations.get_invitation_by_token(input.token) == nil ->
        {:error, "Invalid token"}
      true ->
        :ok
    end
  end
end
