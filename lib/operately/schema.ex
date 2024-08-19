defmodule Operately.Schema do
  defmacro __using__(_) do
    quote do
      use Ecto.Schema
      import Ecto.Changeset
      import Operately.Schema.Helpers

      @primary_key {:id, :binary_id, autogenerate: true}
      @foreign_key_type :binary_id
    end
  end

  defmodule Helpers do
    #
    # For solf deletable resources
    # Usage: add soft_delete() to the schema
    #
    defmacro soft_delete do
      quote do
        field :deleted_at, :utc_datetime_usec
      end
    end

    #
    # Exta field for populating the requester's access level.
    # This field is populated by the Access.Fetch.get_resource_with_access_level/2 function.
    # Usage: add requester_access_level() to the schema
    #
    defmacro requester_access_level do
      quote do
        field :requester_access_level, :string, virtual: true
      end
    end

    def set_requester_access_level(schema, level) do
      if schema.__schema__(:fields)[:requester_access_level] do
        schema |> Map.put(:requester_access_level, level)
      else
        raise """
        The #{__MODULE__} schema does not support setting the requester access level. 
        Maybe you forgot to add the requester_access_level() to the schema?
        """
      end
    end
  end
end
