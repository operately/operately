defmodule Operately.Repo.RequestInfo do
  @moduledoc """
  A struct to hold information about the requester of a resource.
  To use this module, add the following to your schema:

    defmodule MySchema do
      use Operately.Schema
      use Operately.Repo.Getter

      schema "my_schema" do
        ...

        requester_info()
      end
    end

  When added, you can use the `get/2` function to get a resource with the
  requester's access level.

    MySchema.get(person, id: "123")
    MySchema.get(:system, id: "123")

  The `get/2` function returns a {:ok, resource} tuple if the resource was found
  and fills the requester_info field with information about the requester. It
  contains information about the requester. This field is virtual and is not
  stored in the database. The `requester_info` field contains the following
  fields:

    - `requester`: The requester who requested the resource
    - `access_level`: The requester's access level, based on access levels in Operately.Access.Binding.
    - `is_system_request`: A boolean indicating if the requester is the system
  """

  defstruct [
    :requester,
    :access_level,
    :is_system_request
  ]

  defmacro request_info do
    quote do
      field :request_info, :any, virtual: true
    end
  end

  def populate_request_info(resource, requester, access_level) do
    Map.put(resource, :request_info, %__MODULE__{
      requester: requester,
      access_level: access_level,
      is_system_request: requester == :system
    })
  end
end
