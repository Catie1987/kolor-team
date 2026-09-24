import { Metadata } from "next";
import { ProjectListClient } from "./project-list-client";
export const metadata: Metadata = {
  title: "Project Management",
};

export default function ProjectListPage() {
  return (
      <ProjectListClient/>
  );
}