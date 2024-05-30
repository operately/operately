defmodule OperatelyWeb.Graphql.Mutations.Accounts do
  use Absinthe.Schema.Notation

  input_object :change_password_input do
    field :token, non_null(:string)
    field :password, non_null(:string)
    field :password_confirmation, non_null(:string)
  end

  object :account_mutations do
    field :change_password_first_time, :boolean do
      arg :input, non_null(:change_password_input)

      resolve fn %{input: input}, _ ->
        if valid_password_input(input) do
          Operately.Operations.PasswordChanging.run(input)
          {:ok, true}
        else
          {:error, false}
        end
      end
    end
  end

  defp valid_password_input(input) do
    cond do
      input.password != input.password_confirmation -> false
      Operately.Invitations.get_invitation_by_token(input.token) == nil -> false
      true -> true
    end
  end
end
