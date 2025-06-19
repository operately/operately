defmodule Mix.Tasks.Operation.GenActivitySchema do
  def gen(ctx) do
    fields =
      ctx.activity_fields
      |> Enum.map(&create_field/1)
      |> Enum.join("\n")

    Mix.Operately.generate_file(ctx.activity_schema_file_path, fn _ ->
      """
      defmodule Operately.Activities.Content.#{ctx.activity_schema_module_name} do
        use Operately.Activities.Content

        embedded_schema do
          #{Mix.Operately.indent(fields, 4)}
        end

        def changeset(attrs) do
          %__MODULE__{}
          |> cast(attrs, __schema__(:fields))
          |> validate_required(__schema__(:fields))
        end

        def build(params) do
          changeset(params)
        end
      end
      """
    end)
  end

  defp create_field({name, type}) do
    case String.to_atom(type) do
      :company ->
        "belongs_to :#{remove_id(name)}, Operately.Companies.Company"

      :space ->
        "belongs_to :#{remove_id(name)}, Operately.Groups.Group"

      :person ->
        "belongs_to :#{remove_id(name)}, Operately.People.Person"

      :project ->
        "belongs_to :#{remove_id(name)}, Operately.Projects.Project"

      :goal ->
        "belongs_to :#{remove_id(name)}, Operately.Goals.Goal"

      :string ->
        "field :#{name}, :string"

      :integer ->
        "field :#{name}, :integer"

      :float ->
        "field :#{name}, :float"

      :boolean ->
        "field :#{name}, :boolean"

      :date ->
        "field :#{name}, :date"

      _ ->
        raise "Unsupported field type: #{type} for field #{name}. Supported types are: :company, :space, :person, :project, :goal, :string, :integer, :float, :boolean."
    end
  end

  defp remove_id(name) do
    String.replace(name, ~r/_id$/, "")
  end
end
