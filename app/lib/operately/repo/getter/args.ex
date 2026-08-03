defmodule Operately.Repo.Getter.Args do
  alias Operately.Access.Binding

  defstruct field_matchers: [],
            preload: [],
            auth_preload: [],
            with_deleted: false,
            after_load: [],
            required_access_level: nil,
            getter_profile: :default

  @allowed_options [:preload, :auth_preload, :with_deleted, :after_load, :required_access_level, :getter_profile]

  def parse(args) do
    field_matchers = Keyword.delete(args, :opts)
    opts = Keyword.get(args, :opts, [])

    validate_options!(opts)

    %__MODULE__{
      field_matchers: field_matchers,
      preload: Keyword.get(opts, :preload, []),
      auth_preload: Keyword.get(opts, :auth_preload, []),
      with_deleted: Keyword.get(opts, :with_deleted, false),
      after_load: Keyword.get(opts, :after_load, []),
      required_access_level: Keyword.get(opts, :required_access_level, Binding.view_access()),
      getter_profile: Keyword.get(opts, :getter_profile, :default)
    }
  end

  defp validate_options!(opts) do
    unknown_options = Keyword.drop(opts, @allowed_options)

    if unknown_options != [] do
      raise ArgumentError, "Invalid options: #{Keyword.keys(unknown_options)}"
    end
  end
end
