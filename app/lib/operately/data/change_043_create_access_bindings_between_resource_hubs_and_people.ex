defmodule Operately.Data.Change043CreateAccessBindingsBetweenResourceHubsAndPeople do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{AccessBinding, AccessContext, AccessGroup, ResourceHub}

  @comment_access 40
  @full_access 100

  defmodule ResourceHub do
    use Operately.Schema

    schema "resource_hubs" do
      belongs_to :space, __MODULE__.Space, foreign_key: :space_id

      field :name, :string
      field :description, :map

      timestamps()
    end
  end

  defmodule ResourceHub.Space do
    use Operately.Schema

    schema "groups" do
      field :company_id, :binary_id
    end
  end

  defmodule AccessContext do
    use Operately.Schema

    schema "access_contexts" do
      field :resource_hub_id, :binary_id

      timestamps()
    end
  end

  defmodule AccessGroup do
    use Operately.Schema

    schema "access_groups" do
      field :company_id, :binary_id
      field :group_id, :binary_id
      field :tag, :string

      timestamps()
    end
  end

  defmodule AccessBinding do
    use Operately.Schema

    schema "access_bindings" do
      field :group_id, :binary_id
      field :context_id, :binary_id
      field :access_level, :integer

      timestamps()
    end

    def changeset(binding, attrs) do
      binding
      |> cast(attrs, [:group_id, :context_id, :access_level])
      |> validate_required([:group_id, :context_id, :access_level])
    end
  end

  def run do
    Repo.transaction(fn ->
      from(h in ResourceHub, preload: :space, select: h)
      |> Repo.all()
      |> create_bindings()
    end)
  end

  defp create_bindings(hubs) when is_list(hubs) do
    Enum.each(hubs, &(create_bindings(&1)))
  end

  defp create_bindings(hub) do
    context = Repo.get_by!(AccessContext, resource_hub_id: hub.id)

    company_full = Repo.get_by!(AccessGroup, company_id: hub.space.company_id, tag: "full_access")
    space_full = Repo.get_by!(AccessGroup, group_id: hub.space.id, tag: "full_access")
    company_standard = Repo.get_by!(AccessGroup, company_id: hub.space.company_id, tag: "standard")
    space_standard = Repo.get_by!(AccessGroup, group_id: hub.space.id, tag: "standard")

    create_binding(context, company_full, @full_access)
    create_binding(context, space_full, @full_access)
    create_binding(context, company_standard, @comment_access)
    create_binding(context, space_standard, @comment_access)
  end

  defp create_binding(context, group, access_level) do
    case Repo.get_by(AccessBinding, context_id: context.id, group_id: group.id) do
      nil ->
        {:ok, _} =
          %AccessBinding{}
          |> AccessBinding.changeset(%{
            group_id: group.id,
            context_id: context.id,
            access_level: access_level,
          })
          |> Repo.insert()

      _ -> :ok
    end
  end
end
