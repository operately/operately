#!/usr/bin/env elixir

defmodule ReleaseBuilder do
  def run() do
    IO.puts("Building release...")

    path = create_build_dir()

    build_docker_compose_file(path)
    build_docker_env_file(path)
    zip_path = zip_build_dir(path)

    IO.puts("")
    IO.puts("Release built! 🎉")
    IO.puts(zip_path)
  end

  def create_build_dir() do
    IO.write("* Creating build directory: ")
    build_path = Path.join([System.tmp_dir!(), "release-build-#{:rand.uniform(20)}"])
    File.mkdir_p!(build_path)

    IO.puts(build_path)
    build_path
  end

  def build_docker_compose_file(build_path) do
    IO.write("* Building docker-compose file: ")
    template_path = get_template_path("docker-compose.yml.eex")
    output_path = Path.join([build_path, "docker-compose.yml"])
    content = EEx.eval_file(template_path, [version: "1.0.0"])

    IO.puts(output_path)

    File.write!(output_path, content)
  end

  def build_docker_env_file(build_path) do
    IO.write("* Building docker env file: ")
    template_path = get_template_path("operately.env")
    output_path = Path.join([build_path, "operately.env"])
    content = File.read!(template_path)

    IO.puts(output_path)

    File.write!(output_path, content)
  end

  def get_template_path(file_name) do
    cwd = __ENV__.file |> Path.dirname() 

    Path.join([cwd, "templates", file_name])
  end

  def zip_build_dir(build_path) do
    IO.write("* Zipping build directory: ")
    zip_path = Path.join([System.tmp_dir!(), "release-build-#{:rand.uniform(20)}.zip"])
    System.cmd("zip", ["-r", zip_path, build_path])

    IO.puts(zip_path)
    zip_path
  end
end

ReleaseBuilder.run()
