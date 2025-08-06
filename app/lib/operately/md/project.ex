defimpl Operately.MDRender, for: Operately.Projects.Project do
  def render(resource) do
    resource.name
  end
end
