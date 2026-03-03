defmodule OperatelyWeb.Api.ApiTokens do
  defmodule Create do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    alias OperatelyWeb.Api.Serializer

    inputs do
      field? :read_only, :boolean, null: false
    end

    outputs do
      field :api_token, :api_token, null: false
      field :token, :string, null: false
    end

    def call(conn, inputs) do
      if conn.assigns[:api_auth_mode] == :api_token do
        {:error, :forbidden}
      else
        person = conn.assigns[:current_person]
        read_only = if is_nil(inputs[:read_only]), do: true, else: inputs[:read_only]

        case Operately.People.create_api_token(person, %{read_only: read_only}) do
          {:ok, api_token, raw_token} ->
            {:ok, %{
              api_token: Serializer.serialize(api_token, level: :essential),
              token: raw_token,
            }}

          {:error, _changeset} ->
            {:error, :internal_server_error}
        end
      end
    end
  end

  defmodule Delete do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :id, :id
    end

    outputs do
      field :success, :boolean, null: false
    end

    def call(conn, inputs) do
      if conn.assigns[:api_auth_mode] == :api_token do
        {:error, :forbidden}
      else
        person = conn.assigns[:current_person]

        case Operately.People.delete_api_token(person, inputs.id) do
          {:ok, :deleted} ->
            {:ok, %{success: true}}

          {:error, :not_found} ->
            {:error, :not_found}
        end
      end
    end
  end

  defmodule List do
    use TurboConnect.Query
    use OperatelyWeb.Api.Helpers

    alias OperatelyWeb.Api.Serializer

    outputs do
      field :api_tokens, list_of(:api_token)
    end

    def call(conn, _inputs) do
      if conn.assigns[:api_auth_mode] == :api_token do
        {:error, :forbidden}
      else
        person = conn.assigns[:current_person]
        api_tokens = Operately.People.list_api_tokens(person)
        {:ok, %{api_tokens: Enum.map(api_tokens, &Serializer.serialize(&1, level: :essential))}}
      end
    end
  end

  defmodule SetReadOnly do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    alias OperatelyWeb.Api.Serializer

    inputs do
      field :id, :id
      field :read_only, :boolean
    end

    outputs do
      field :api_token, :api_token, null: false
    end

    def call(conn, inputs) do
      if conn.assigns[:api_auth_mode] == :api_token do
        {:error, :forbidden}
      else
        person = conn.assigns[:current_person]

        case Operately.People.set_api_token_read_only(person, inputs.id, inputs.read_only) do
          {:ok, api_token} ->
            {:ok, %{
              api_token: Serializer.serialize(api_token, level: :essential),
            }}

          {:error, :not_found} ->
            {:error, :not_found}

          {:error, _} ->
            {:error, :internal_server_error}
        end
      end
    end
  end

  defmodule UpdateName do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    alias OperatelyWeb.Api.Serializer

    inputs do
      field :id, :id
      field? :name, :string, null: true
    end

    outputs do
      field :api_token, :api_token, null: false
    end

    def call(conn, inputs) do
      if conn.assigns[:api_auth_mode] == :api_token do
        {:error, :forbidden}
      else
        person = conn.assigns[:current_person]

        case Operately.People.set_api_token_name(person, inputs.id, inputs[:name]) do
          {:ok, api_token} ->
            {:ok, %{
              api_token: Serializer.serialize(api_token, level: :essential),
            }}

          {:error, :not_found} ->
            {:error, :not_found}

          {:error, %Ecto.Changeset{}} ->
            {:error, :bad_request}

          {:error, _} ->
            {:error, :internal_server_error}
        end
      end
    end
  end
end
