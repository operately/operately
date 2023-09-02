defmodule Operately.SoftDelete.Schema do
  defmacro soft_delete do
    quote do
      field :deleted_at, :utc_datetime_usec
    end
  end
end
